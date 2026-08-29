"""Google Search Console service — backend-only, credentials never exposed to frontend."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from models.search_console import (
    SearchConsoleConnection,
    SearchConsoleCache,
    SearchAnalyticsQuery,
    SearchAnalyticsResponse,
    SearchAnalyticsRow,
    SearchConsoleOverview,
    TopQuery,
    TopPage,
    CountryData,
    DeviceData,
    SearchAppearanceData,
    DateRange,
    get_date_range,
)

logger = logging.getLogger("teraplayer.search_console")

# Scopes required for Search Console API
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

# Cache TTL in seconds (1 hour)
CACHE_TTL_SECONDS = 3600

# Maximum rows per API request
MAX_ROWS_PER_REQUEST = 25000


class SearchConsoleError(Exception):
    """Custom exception for Search Console errors."""
    def __init__(self, message: str, code: Optional[int] = None):
        self.message = message
        self.code = code
        super().__init__(message)


def _get_service_account_credentials() -> Optional[service_account.Credentials]:
    """Load service account credentials from environment variable."""
    import os

    creds_json = os.environ.get("GOOGLE_SEARCH_CONSOLE_CREDENTIALS")
    if not creds_json:
        return None

    try:
        creds_info = json.loads(creds_json)
        credentials = service_account.Credentials.from_service_account_info(
            creds_info, scopes=SCOPES
        )
        return credentials
    except Exception as exc:
        logger.error("Failed to load Search Console credentials", exc_info=exc)
        return None


def _get_service():
    """Build and return the Search Console API service."""
    credentials = _get_service_account_credentials()
    if not credentials:
        raise SearchConsoleError("Google Search Console credentials not configured", 503)

    try:
        service = build("searchconsole", "v1", credentials=credentials, cache_discovery=False)
        return service
    except Exception as exc:
        logger.error("Failed to build Search Console service", exc_info=exc)
        raise SearchConsoleError(f"Failed to initialize Search Console API: {exc}", 503)


async def get_connection_status(db) -> SearchConsoleConnection:
    """Get current Search Console connection status from database."""
    if db is None:
        return SearchConsoleConnection()

    doc = await db.search_console_connection.find_one({"_id": "connection"}, {"_id": 0})
    if not doc:
        return SearchConsoleConnection()

    return SearchConsoleConnection(**doc)


async def save_connection(db, property_url: str, service_account_email: str) -> SearchConsoleConnection:
    """Save Search Console connection configuration."""
    if db is None:
        raise RuntimeError("MongoDB not configured")

    # Test the connection first
    try:
        service = _get_service()
        # Verify property access
        sites = service.sites().list().execute()
        site_urls = [s["siteUrl"] for s in sites.get("siteEntry", [])]

        if property_url not in site_urls:
            raise SearchConsoleError(f"Property '{property_url}' not found in Search Console. Available: {site_urls}", 404)

        # Test a simple query
        _ = service.searchanalytics().query(
            siteUrl=property_url,
            body={
                "startDate": (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d"),
                "endDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "rowLimit": 1
            }
        ).execute()

    except HttpError as exc:
        error_details = json.loads(exc.content.decode()) if exc.content else {}
        raise SearchConsoleError(f"Google API error: {error_details.get('error', {}).get('message', str(exc))}", exc.resp.status)
    except SearchConsoleError:
        raise
    except Exception as exc:
        logger.error("Connection test failed", exc_info=exc)
        raise SearchConsoleError(f"Connection test failed: {exc}", 500)

    connection = SearchConsoleConnection(
        connected=True,
        property_url=property_url,
        service_account_email=service_account_email,
        last_sync_at=datetime.now(timezone.utc).isoformat(),
        last_error=None,
    )

    await db.search_console_connection.update_one(
        {"_id": "connection"},
        {"$set": connection.model_dump()},
        upsert=True,
    )

    # Create index for cache collection
    await db.search_console_cache.create_index("expires_at", expireAfterSeconds=0)
    await db.search_console_cache.create_index("cache_key", unique=True)

    return connection


async def disconnect_search_console(db) -> SearchConsoleConnection:
    """Disconnect Search Console."""
    if db is None:
        raise RuntimeError("MongoDB not configured")

    connection = SearchConsoleConnection()
    await db.search_console_connection.update_one(
        {"_id": "connection"},
        {"$set": connection.model_dump()},
        upsert=True,
    )

    # Clear cache
    await db.search_console_cache.delete_many({})

    return connection


def _build_cache_key(query: SearchAnalyticsQuery) -> str:
    """Build a cache key from query parameters."""
    import hashlib
    key_str = f"{query.start_date}|{query.end_date}|{','.join(query.dimensions)}|{query.search_type}|{query.row_limit}|{query.start_row}"
    if query.dimension_filter_groups:
        key_str += f"|{json.dumps(query.dimension_filter_groups, sort_keys=True)}"
    return hashlib.sha256(key_str.encode()).hexdigest()[:32]


async def _get_cached_data(db, cache_key: str) -> Optional[dict]:
    """Get cached data if not expired."""
    if db is None:
        return None

    doc = await db.search_console_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if not doc:
        return None

    expires_at = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
    if expires_at < datetime.now(timezone.utc):
        await db.search_console_cache.delete_one({"cache_key": cache_key})
        return None

    return doc["data"]


async def _set_cached_data(db, cache_key: str, data: dict) -> None:
    """Cache data with TTL."""
    if db is None:
        return

    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS)).isoformat()
    await db.search_console_cache.update_one(
        {"cache_key": cache_key},
        {
            "$set": {
                "cache_key": cache_key,
                "data": data,
                "expires_at": expires_at,
            }
        },
        upsert=True,
    )


async def query_search_analytics(db, query: SearchAnalyticsQuery) -> SearchAnalyticsResponse:
    """Query Search Console analytics with caching."""
    # Check cache first
    cache_key = _build_cache_key(query)
    cached = await _get_cached_data(db, cache_key)
    if cached:
        return SearchAnalyticsResponse(**cached)

    # Query API
    try:
        service = _get_service()
        connection = await get_connection_status(db)
        if not connection.connected or not connection.property_url:
            raise SearchConsoleError("Search Console not connected", 503)

        body = {
            "startDate": query.start_date,
            "endDate": query.end_date,
            "dimensions": query.dimensions,
            "rowLimit": min(query.row_limit, MAX_ROWS_PER_REQUEST),
            "startRow": query.start_row,
            "searchType": query.search_type,
        }

        if query.dimension_filter_groups:
            body["dimensionFilterGroups"] = query.dimension_filter_groups

        if query.aggregation_type:
            body["aggregationType"] = query.aggregation_type

        result = service.searchanalytics().query(
            siteUrl=connection.property_url,
            body=body
        ).execute()

        response = SearchAnalyticsResponse(
            rows=[SearchAnalyticsRow(**row) for row in result.get("rows", [])],
            response_aggregation_type=result.get("responseAggregationType"),
        )

        # Cache the response
        await _set_cached_data(db, cache_key, response.model_dump())

        # Update last sync time
        await db.search_console_connection.update_one(
            {"_id": "connection"},
            {"$set": {"last_sync_at": datetime.now(timezone.utc).isoformat(), "last_error": None}}
        )

        return response

    except HttpError as exc:
        error_details = json.loads(exc.content.decode()) if exc.content else {}
        error_msg = error_details.get("error", {}).get("message", str(exc))
        logger.error(f"Search Console API error: {error_msg}")

        # Update last error
        if db is not None:
            await db.search_console_connection.update_one(
                {"_id": "connection"},
                {"$set": {"last_error": error_msg, "last_sync_at": datetime.now(timezone.utc).isoformat()}}
            )

        raise SearchConsoleError(f"Google API error: {error_msg}", exc.resp.status)
    except SearchConsoleError:
        raise
    except Exception as exc:
        logger.error("Search analytics query failed", exc_info=exc)
        raise SearchConsoleError(f"Query failed: {exc}", 500)


def _aggregate_overview(rows: list[SearchAnalyticsRow]) -> SearchConsoleOverview:
    """Aggregate rows into overview metrics."""
    total_clicks = sum(r.clicks for r in rows)
    total_impressions = sum(r.impressions for r in rows)

    if total_impressions > 0:
        avg_ctr = round((total_clicks / total_impressions) * 100, 2)
    else:
        avg_ctr = 0.0

    # Weighted average position
    if total_impressions > 0:
        weighted_position = sum(r.position * r.impressions for r in rows) / total_impressions
        avg_position = round(weighted_position, 1)
    else:
        avg_position = 0.0

    return SearchConsoleOverview(
        total_clicks=total_clicks,
        total_impressions=total_impressions,
        avg_ctr=avg_ctr,
        avg_position=avg_position,
        date_range="",
    )


async def get_overview(db, range_key: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> dict[str, Any]:
    """Get overview metrics for a date range with optional comparison."""
    date_range = get_date_range(range_key, custom_start, custom_end)

    # Current period
    current_query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        row_limit=MAX_ROWS_PER_REQUEST,
    )
    current_response = await query_search_analytics(db, current_query)
    current_overview = _aggregate_overview(current_response.rows)
    current_overview.date_range = date_range.label

    # Comparison period
    comparison_overview = None
    if date_range.comparison_start_date and date_range.comparison_end_date:
        comparison_query = SearchAnalyticsQuery(
            start_date=date_range.comparison_start_date,
            end_date=date_range.comparison_end_date,
            row_limit=MAX_ROWS_PER_REQUEST,
        )
        comparison_response = await query_search_analytics(db, comparison_query)
        comparison_overview = _aggregate_overview(comparison_response.rows)
        comparison_overview.date_range = date_range.comparison_label or "Previous Period"

        # Calculate changes
        if comparison_overview.total_clicks > 0:
            current_overview.clicks_change = round(
                ((current_overview.total_clicks - comparison_overview.total_clicks) / comparison_overview.total_clicks) * 100, 1
            )
        if comparison_overview.total_impressions > 0:
            current_overview.impressions_change = round(
                ((current_overview.total_impressions - comparison_overview.total_impressions) / comparison_overview.total_impressions) * 100, 1
            )
        if comparison_overview.avg_ctr > 0:
            current_overview.ctr_change = round(
                ((current_overview.avg_ctr - comparison_overview.avg_ctr) / comparison_overview.avg_ctr) * 100, 1
            )
        if comparison_overview.avg_position > 0:
            current_overview.position_change = round(
                current_overview.avg_position - comparison_overview.avg_position, 1
            )

        current_overview.comparison_date_range = comparison_overview.date_range

    return {
        "current": current_overview.model_dump(),
        "comparison": comparison_overview.model_dump() if comparison_overview else None,
    }


async def get_top_queries(db, range_key: str, limit: int = 100, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> list[dict]:
    """Get top queries for a date range."""
    date_range = get_date_range(range_key, custom_start, custom_end)

    # Current period
    current_query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        dimensions=["query"],
        row_limit=limit,
    )
    current_response = await query_search_analytics(db, current_query)

    queries = []
    for row in current_response.rows:
        if not row.keys:
            continue
        query_text = row.keys[0]
        q = TopQuery(
            query=query_text,
            clicks=row.clicks,
            impressions=row.impressions,
            ctr=round(row.ctr * 100, 2) if row.ctr else 0.0,
            position=round(row.position, 1) if row.position else 0.0,
        )

        # Comparison data
        if date_range.comparison_start_date and date_range.comparison_end_date:
            comp_query = SearchAnalyticsQuery(
                start_date=date_range.comparison_start_date,
                end_date=date_range.comparison_end_date,
                dimensions=["query"],
                dimension_filter_groups=[{
                    "filters": [{
                        "dimension": "query",
                        "operator": "equals",
                        "expression": query_text,
                    }]
                }],
                row_limit=1,
            )
            try:
                comp_response = await query_search_analytics(db, comp_query)
                if comp_response.rows:
                    comp_row = comp_response.rows[0]
                    q.clicks_prev = comp_row.clicks
                    q.impressions_prev = comp_row.impressions
                    q.ctr_prev = round(comp_row.ctr * 100, 2) if comp_row.ctr else 0.0
                    q.position_prev = round(comp_row.position, 1) if comp_row.position else 0.0
            except Exception:
                pass

        queries.append(q.model_dump())

    # Sort by clicks descending
    queries.sort(key=lambda x: x["clicks"], reverse=True)
    return queries[:limit]


async def get_top_pages(db, range_key: str, limit: int = 100, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> list[dict]:
    """Get top pages for a date range."""
    date_range = get_date_range(range_key, custom_start, custom_end)

    current_query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        dimensions=["page"],
        row_limit=limit,
    )
    current_response = await query_search_analytics(db, current_query)

    pages = []
    for row in current_response.rows:
        if not row.keys:
            continue
        page_url = row.keys[0]
        p = TopPage(
            page=page_url,
            clicks=row.clicks,
            impressions=row.impressions,
            ctr=round(row.ctr * 100, 2) if row.ctr else 0.0,
            position=round(row.position, 1) if row.position else 0.0,
        )

        if date_range.comparison_start_date and date_range.comparison_end_date:
            comp_query = SearchAnalyticsQuery(
                start_date=date_range.comparison_start_date,
                end_date=date_range.comparison_end_date,
                dimensions=["page"],
                dimension_filter_groups=[{
                    "filters": [{
                        "dimension": "page",
                        "operator": "equals",
                        "expression": page_url,
                    }]
                }],
                row_limit=1,
            )
            try:
                comp_response = await query_search_analytics(db, comp_query)
                if comp_response.rows:
                    comp_row = comp_response.rows[0]
                    p.clicks_prev = comp_row.clicks
                    p.impressions_prev = comp_row.impressions
                    p.ctr_prev = round(comp_row.ctr * 100, 2) if comp_row.ctr else 0.0
                    p.position_prev = round(comp_row.position, 1) if comp_row.position else 0.0
            except Exception:
                pass

        pages.append(p.model_dump())

    pages.sort(key=lambda x: x["clicks"], reverse=True)
    return pages[:limit]


async def get_countries(db, range_key: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> list[dict]:
    """Get country breakdown for a date range."""
    date_range = get_date_range(range_key, custom_start, custom_end)

    query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        dimensions=["country"],
        row_limit=MAX_ROWS_PER_REQUEST,
    )
    response = await query_search_analytics(db, query)

    countries = []
    for row in response.rows:
        if not row.keys:
            continue
        countries.append(CountryData(
            country=row.keys[0],
            clicks=row.clicks,
            impressions=row.impressions,
            ctr=round(row.ctr * 100, 2) if row.ctr else 0.0,
            position=round(row.position, 1) if row.position else 0.0,
        ).model_dump())

    countries.sort(key=lambda x: x["clicks"], reverse=True)
    return countries


async def get_devices(db, range_key: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> list[dict]:
    """Get device breakdown for a date range."""
    date_range = get_date_range(range_key, custom_start, custom_end)

    query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        dimensions=["device"],
        row_limit=10,
    )
    response = await query_search_analytics(db, query)

    devices = []
    for row in response.rows:
        if not row.keys:
            continue
        devices.append(DeviceData(
            device=row.keys[0].capitalize(),
            clicks=row.clicks,
            impressions=row.impressions,
            ctr=round(row.ctr * 100, 2) if row.ctr else 0.0,
            position=round(row.position, 1) if row.position else 0.0,
        ).model_dump())

    return devices


async def get_search_appearance(db, range_key: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> list[dict]:
    """Get search appearance breakdown for a date range."""
    date_range = get_date_range(range_key, custom_start, custom_end)

    query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        dimensions=["searchAppearance"],
        row_limit=50,
    )
    response = await query_search_analytics(db, query)

    appearances = []
    for row in response.rows:
        if not row.keys:
            continue
        appearances.append(SearchAppearanceData(
            search_appearance=row.keys[0] or "Other",
            clicks=row.clicks,
            impressions=row.impressions,
            ctr=round(row.ctr * 100, 2) if row.ctr else 0.0,
            position=round(row.position, 1) if row.position else 0.0,
        ).model_dump())

    appearances.sort(key=lambda x: x["clicks"], reverse=True)
    return appearances


async def get_chart_data(db, range_key: str, metrics: list[str] = None, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> list[dict]:
    """Get time series data for charts."""
    if metrics is None:
        metrics = ["clicks", "impressions", "ctr", "position"]

    date_range = get_date_range(range_key, custom_start, custom_end)

    # Get daily data
    query = SearchAnalyticsQuery(
        start_date=date_range.start_date,
        end_date=date_range.end_date,
        dimensions=["date"],
        row_limit=MAX_ROWS_PER_REQUEST,
    )
    response = await query_search_analytics(db, query)

    # Build chart data
    chart_data = []
    for row in response.rows:
        if not row.keys:
            continue
        date_str = row.keys[0]
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            formatted_date = date_obj.strftime("%b %d")
        except Exception:
            formatted_date = date_str

        data_point = {"date": formatted_date, "day": date_str}
        for metric in metrics:
            if metric == "clicks":
                data_point[metric] = row.clicks
            elif metric == "impressions":
                data_point[metric] = row.impressions
            elif metric == "ctr":
                data_point[metric] = round(row.ctr * 100, 2) if row.ctr else 0.0
            elif metric == "position":
                data_point[metric] = round(row.position, 1) if row.position else 0.0
        chart_data.append(data_point)

    # Sort by date
    chart_data.sort(key=lambda x: x["day"])
    return chart_data
