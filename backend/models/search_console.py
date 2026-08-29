"""Google Search Console models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


SearchType = Literal["web", "image", "video", "news", "discover", "google_news"]


class SearchConsoleConnection(BaseModel):
    """Google Search Console connection configuration."""

    model_config = ConfigDict(extra="ignore")

    connected: bool = False
    property_url: Optional[str] = None
    service_account_email: Optional[str] = None
    last_sync_at: Optional[str] = None
    last_error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SearchConsoleCache(BaseModel):
    """Cached Search Console data to avoid excessive API calls."""

    model_config = ConfigDict(extra="ignore")

    cache_key: str
    data: dict
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SearchAnalyticsQuery(BaseModel):
    """Search analytics query parameters."""

    model_config = ConfigDict(extra="ignore")

    start_date: str
    end_date: str
    dimensions: list[str] = Field(default_factory=list)
    dimension_filter_groups: Optional[list[dict]] = None
    aggregation_type: Optional[Literal["auto", "by_page", "by_property"]] = None
    row_limit: int = 1000
    start_row: int = 0
    search_type: SearchType = "web"


class SearchAnalyticsRow(BaseModel):
    """Single row of search analytics data."""

    model_config = ConfigDict(extra="ignore")

    keys: list[str] = Field(default_factory=list)
    clicks: int = 0
    impressions: int = 0
    ctr: float = 0.0
    position: float = 0.0


class SearchAnalyticsResponse(BaseModel):
    """Search analytics API response."""

    model_config = ConfigDict(extra="ignore")

    rows: list[SearchAnalyticsRow] = Field(default_factory=list)
    response_aggregation_type: Optional[str] = None


class DateRange(BaseModel):
    """Date range for queries."""

    model_config = ConfigDict(extra="ignore")

    start_date: str
    end_date: str
    label: str
    comparison_start_date: Optional[str] = None
    comparison_end_date: Optional[str] = None
    comparison_label: Optional[str] = None


class SearchConsoleOverview(BaseModel):
    """Overview metrics for Search Console."""

    model_config = ConfigDict(extra="ignore")

    total_clicks: int = 0
    total_impressions: int = 0
    avg_ctr: float = 0.0
    avg_position: float = 0.0
    clicks_change: Optional[float] = None
    impressions_change: Optional[float] = None
    ctr_change: Optional[float] = None
    position_change: Optional[float] = None
    date_range: str
    comparison_date_range: Optional[str] = None


class TopQuery(BaseModel):
    """Top search query data."""

    model_config = ConfigDict(extra="ignore")

    query: str
    clicks: int
    impressions: int
    ctr: float
    position: float
    clicks_prev: Optional[int] = None
    impressions_prev: Optional[int] = None
    ctr_prev: Optional[float] = None
    position_prev: Optional[float] = None


class TopPage(BaseModel):
    """Top page data."""

    model_config = ConfigDict(extra="ignore")

    page: str
    clicks: int
    impressions: int
    ctr: float
    position: float
    clicks_prev: Optional[int] = None
    impressions_prev: Optional[int] = None
    ctr_prev: Optional[float] = None
    position_prev: Optional[float] = None


class CountryData(BaseModel):
    """Country breakdown data."""

    model_config = ConfigDict(extra="ignore")

    country: str
    clicks: int
    impressions: int
    ctr: float
    position: float


class DeviceData(BaseModel):
    """Device breakdown data."""

    model_config = ConfigDict(extra="ignore")

    device: str
    clicks: int
    impressions: int
    ctr: float
    position: float


class SearchAppearanceData(BaseModel):
    """Search appearance data."""

    model_config = ConfigDict(extra="ignore")

    search_appearance: str
    clicks: int
    impressions: int
    ctr: float
    position: float


PREDEFINED_RANGES = [
    DateRange(start_date="", end_date="", label="Last 24 hours", comparison_start_date="", comparison_end_date="", comparison_label="Previous 24 hours"),
    DateRange(start_date="", end_date="", label="Last 7 days", comparison_start_date="", comparison_end_date="", comparison_label="Previous 7 days"),
    DateRange(start_date="", end_date="", label="Last 28 days", comparison_start_date="", comparison_end_date="", comparison_label="Previous 28 days"),
    DateRange(start_date="", end_date="", label="Last 3 months", comparison_start_date="", comparison_end_date="", comparison_label="Previous 3 months"),
]


def get_date_range(range_key: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> DateRange:
    """Get date range by key with computed dates."""
    from datetime import timedelta

    end = datetime.now(timezone.utc).date()

    range_map = {
        "24h": (1, 1),
        "7d": (7, 7),
        "28d": (28, 28),
        "3m": (90, 90),
    }

    if range_key == "custom" and custom_start and custom_end:
        start = datetime.fromisoformat(custom_start).date()
        end_date = datetime.fromisoformat(custom_end).date()
        days = (end_date - start).days + 1
        comparison_end = start - timedelta(days=1)
        comparison_start = comparison_end - timedelta(days=days - 1)
        return DateRange(
            start_date=start.isoformat(),
            end_date=end_date.isoformat(),
            label="Custom Range",
            comparison_start_date=comparison_start.isoformat(),
            comparison_end_date=comparison_end.isoformat(),
            comparison_label="Previous Period"
        )

    days_back, compare_days = range_map.get(range_key, (7, 7))
    start = end - timedelta(days=days_back - 1)
    comparison_end = start - timedelta(days=1)
    comparison_start = comparison_end - timedelta(days=days_back - 1)

    labels = {
        "24h": "Last 24 hours",
        "7d": "Last 7 days",
        "28d": "Last 28 days",
        "3m": "Last 3 months",
    }

    return DateRange(
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        label=labels.get(range_key, "Last 7 days"),
        comparison_start_date=comparison_start.isoformat(),
        comparison_end_date=comparison_end.isoformat(),
        comparison_label=f"Previous {labels.get(range_key, '7 days').lower()}"
    )
