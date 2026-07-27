from TeraboxDL import TeraboxDL

COOKIE = input("Paste your TeraBox cookie: ").strip()
LINK = input("Paste TeraBox link: ").strip()

tb = TeraboxDL(COOKIE)

try:
    info = tb.get_file_info(LINK)
    print("\n===== RESULT =====")
    print(info)
except Exception as e:
    print("\nERROR:")
    print(e)