ALL_SECTION_IDS = [
    "overview",
    "requests",
    "amreview",
    "projects",
    "fleet",
    "schedule",
    "allotment",
    "rawmat",
    "spares",
    "postposing",
    "flow",
    "config",
    "admin",
    "repository",
]

MEMBER_ASSIGNABLE_SECTION_IDS = [
    section_id for section_id in ALL_SECTION_IDS if section_id not in {"config", "admin"}
]

DEFAULT_MEMBER_TABS = ["overview"]


def normalize_tenant_settings(settings):
    normalized = deepcopy(settings or {})
    normalized.setdefault("max_users", 5)
    normalized.setdefault("max_machines", 2)
    normalized.setdefault("contact_email", "")
    normalized.setdefault("member_access", {})
    return normalized


def sanitize_tabs(tabs, role):
    if role in {"super_admin", "admin"}:
        return list(ALL_SECTION_IDS)

    requested = list(dict.fromkeys(tabs or DEFAULT_MEMBER_TABS))
    filtered = [tab for tab in requested if tab in MEMBER_ASSIGNABLE_SECTION_IDS]
    return filtered or list(DEFAULT_MEMBER_TABS)


def get_user_tabs(settings, user_id, role):
    if role in {"super_admin", "admin"}:
        return list(ALL_SECTION_IDS)

    normalized = normalize_tenant_settings(settings)
    member_access = normalized["member_access"].get(str(user_id), {})
    return sanitize_tabs(member_access.get("tabs", DEFAULT_MEMBER_TABS), role)


def set_user_tabs(settings, user_id, role, tabs):
    normalized = normalize_tenant_settings(settings)

    if role in {"super_admin", "admin"}:
        normalized["member_access"].pop(str(user_id), None)
        return normalized

    normalized["member_access"][str(user_id)] = {"tabs": sanitize_tabs(tabs, role)}
    return normalized


def clear_user_tabs(settings, user_id):
    normalized = normalize_tenant_settings(settings)
    normalized["member_access"].pop(str(user_id), None)
    return normalized
from copy import deepcopy
