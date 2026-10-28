"""
Professions an owner can pick (Portfolio.settings["profession"]).

A profession renames a few sections so they read right for that kind of work. The frontend
(src/lib/professions.js, keep in sync) also uses it to suggest a layout and a CV template.
"""

# Section titles that differ from the defaults, per profession. Used as CV section titles.
SECTION_TITLES = {
    "general": {},
    "developer": {"achievements": "Awards & talks"},
    "designer": {"projects": "Selected work", "achievements": "Awards & features"},
    "architect": {"achievements": "Awards & competitions"},
    "photographer": {"projects": "Selected work", "achievements": "Exhibitions & awards"},
    "student": {"achievements": "Awards & activities"},
    "researcher": {"projects": "Research projects", "achievements": "Publications & awards"},
}
PROFESSIONS = list(SECTION_TITLES)


def profession_of(portfolio):
    profession = (portfolio.settings or {}).get("profession")
    return profession if profession in SECTION_TITLES else "general"


def section_title(profession, section, default):
    return SECTION_TITLES.get(profession, {}).get(section, default)
