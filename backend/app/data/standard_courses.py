"""
Standard course list for autocomplete and shared embeddings
Students can select from these courses to benefit from shared knowledge
"""

STANDARD_COURSES = [
    # GCIS Courses
    {"code": "GCIS-123", "name": "Software Dev & Prob Solv I"},
    {"code": "GCIS-124", "name": "Software Dev & Prob Solv II"},
    {"code": "GCIS-127", "name": "Software Dev for Transfers"},
    {"code": "GCIS-210", "name": "VIP Computing"},
    {"code": "GCIS-410", "name": "VIP Computing II"},
    {"code": "GCIS-505", "name": "AI for Programmers"},
    {"code": "GCIS-610", "name": "VIP Computing - Grad"},

    # CSCI Undergraduate Courses
    {"code": "CSCI-140", "name": "Comp Science For AP Students"},
    {"code": "CSCI-141", "name": "Computer Science I"},
    {"code": "CSCI-142", "name": "Computer Science II"},
    {"code": "CSCI-242", "name": "Comp Sci for Trans Students"},
    {"code": "CSCI-243", "name": "The Mechanics of Programming"},
    {"code": "CSCI-250", "name": "Concepts of Computer Systems"},
    {"code": "CSCI-251", "name": "Conc of Par & Dist Systems"},
    {"code": "CSCI-261", "name": "Analysis of Algorithms"},
    {"code": "CSCI-262", "name": "Intro to Comp Science Theory"},
    {"code": "CSCI-264", "name": "Honors Analysis of Algorithms"},
    {"code": "CSCI-320", "name": "Principles of Data Management"},
    {"code": "CSCI-331", "name": "Intro Artificial Intelligence"},
    {"code": "CSCI-335", "name": "Machine Learning"},
    {"code": "CSCI-344", "name": "Programming Language Concepts"},
    {"code": "CSCI-351", "name": "Data Comm & Networks"},
    {"code": "CSCI-352", "name": "Operating Systems"},
    {"code": "CSCI-420", "name": "Principles of Data Mining"},
    {"code": "CSCI-431", "name": "Intro to Computer Vision"},
    {"code": "CSCI-462", "name": "Introduction to Cryptography"},
    {"code": "CSCI-464", "name": "Xtreme Theory"},
    {"code": "CSCI-471", "name": "Professional Communications"},
    {"code": "CSCI-472", "name": "Historical & Current Comp Sci"},
    {"code": "CSCI-499", "name": "Comp Sci Undergrad Co-op"},
    {"code": "CSCI-510", "name": "Intro to Computer Graphics"},
    {"code": "CSCI-532", "name": "Intro to Intell Security Sys"},
    {"code": "CSCI-541", "name": "Programming Skills"},
    {"code": "CSCI-571", "name": "Honors Capstone Research"},
    {"code": "CSCI-589", "name": "Ugrad Thesis Proposal & Prep"},
    {"code": "CSCI-590", "name": "Undergraduate Thesis"},
    {"code": "CSCI-599", "name": "Comp Sci Undergrad Ind Study"},

    # CSCI Graduate Courses
    {"code": "CSCI-603", "name": "Computational Problem Solving"},
    {"code": "CSCI-605", "name": "Adv OO Programming Concepts"},
    {"code": "CSCI-610", "name": "Found of Computer Graphics"},
    {"code": "CSCI-620", "name": "Introduction to Big Data"},
    {"code": "CSCI-621", "name": "Database System Implementation"},
    {"code": "CSCI-622", "name": "Data Security and Privacy"},
    {"code": "CSCI-630", "name": "Found Artificial Intelligence"},
    {"code": "CSCI-631", "name": "Foundations of Computer Vision"},
    {"code": "CSCI-635", "name": "Intro to Machine Learning"},
    {"code": "CSCI-641", "name": "Advanced Programming Skills"},
    {"code": "CSCI-642", "name": "Secure Coding"},
    {"code": "CSCI-651", "name": "Found of Computer Networks"},
    {"code": "CSCI-652", "name": "Distributed Systems"},
    {"code": "CSCI-654", "name": "Found of Parallel Computing"},
    {"code": "CSCI-661", "name": "Found of Comp Science Theory"},
    {"code": "CSCI-662", "name": "Foundations of Cryptography"},
    {"code": "CSCI-665", "name": "Foundations of Algorithms"},
    {"code": "CSCI-699", "name": "Comp Sci Graduate Co-op"},
    {"code": "CSCI-712", "name": "Comp Animation: Algorithms"},
    {"code": "CSCI-716", "name": "Computational Geometry"},
    {"code": "CSCI-720", "name": "Big Data Analytics"},
    {"code": "CSCI-723", "name": "Adv DB: Graph Databases"},
    {"code": "CSCI-724", "name": "Web Serv & Serv Oriented Comp"},
    {"code": "CSCI-725", "name": "Adv DB: NoSQL/NewSQL"},
    {"code": "CSCI-731", "name": "Advanced Computer Vision"},
    {"code": "CSCI-735", "name": "Found of Intell Security Sys"},
    {"code": "CSCI-739", "name": "Topics in Artificial Intelligence"},
    {"code": "CSCI-740", "name": "Programming Language Theory"},
    {"code": "CSCI-787", "name": "MS Thesis Proposal & Prep"},
    {"code": "CSCI-788", "name": "Computer Science MS Project"},
    {"code": "CSCI-790", "name": "Computer Science MS Thesis"},
    {"code": "CSCI-799", "name": "Comp Sci Graduate Ind Study"},
    {"code": "CSCI-900", "name": "Continuation of Thesis"},
    {"code": "CSCI-901", "name": "Continuation of Project"},
    {"code": "CSCI-909", "name": "Proposal Development"},
    {"code": "CSCI-99", "name": "Undergraduate Co-op Seminar"},
]


def search_courses(query: str, limit: int = 10):
    """
    Search courses by code or name using alphabetical comparison
    Returns courses that match the query string
    """
    if not query:
        return STANDARD_COURSES[:limit]

    query_lower = query.lower()
    matches = []

    for course in STANDARD_COURSES:
        code_lower = course["code"].lower()
        name_lower = course["name"].lower()

        # Check if query matches start of code or name
        if code_lower.startswith(query_lower) or name_lower.startswith(query_lower):
            matches.append({
                **course,
                "display": f"{course['code']} - {course['name']}",
                "priority": 1  # Exact prefix match
            })
        # Check if query is contained anywhere in code or name
        elif query_lower in code_lower or query_lower in name_lower:
            matches.append({
                **course,
                "display": f"{course['code']} - {course['name']}",
                "priority": 2  # Partial match
            })

    # Sort by priority (exact prefix first), then alphabetically by code
    matches.sort(key=lambda x: (x["priority"], x["code"]))

    return matches[:limit]


def get_course_by_code(code: str):
    """Get a specific course by its code"""
    for course in STANDARD_COURSES:
        if course["code"].upper() == code.upper():
            return course
    return None


def get_all_courses():
    """Get all standard courses"""
    return STANDARD_COURSES
