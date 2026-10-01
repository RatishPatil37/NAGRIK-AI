"""Automated Unit Tests for Department Escalation and SLA Contract."""

import re
from backend.src.escalation.sla import calculate_sla
from backend.src.escalation.ticket import generate_ticket_id
from backend.src.escalation.triage import triage_grievance


def test_sla_calculation():
    """Validates statutory SLA hours for various departments and priorities."""
    wtr_emerg_hours, _ = calculate_sla("WTR", "emergency")
    assert wtr_emerg_hours == 4

    ele_emerg_hours, _ = calculate_sla("ELE", "emergency")
    assert ele_emerg_hours == 2

    rev_std_hours, _ = calculate_sla("REV", "standard")
    assert rev_std_hours == 168  # 7 days

    san_std_hours, _ = calculate_sla("SAN", "standard")
    assert san_std_hours == 24


def test_ticket_id_format():
    """Validates standardized ticket hash regex: MNC-{YEAR}-W{WARD:02d}-{DEPT_CODE}-{HASH4}."""
    ticket_id = generate_ticket_id(ward_id=4, dept_code="WTR", citizen_identifier="user123")
    pattern = r"^MNC-\d{4}-W04-WTR-[A-Z0-9]{4}$"
    assert re.match(pattern, ticket_id) is not None, f"Ticket '{ticket_id}' did not match pattern '{pattern}'"


def test_triage_engine_routing():
    """Validates issue classification into correct municipal department."""
    # Water Supply
    g1 = triage_grievance("Main water pipeline burst and drinking water is contaminated", ward_id=4)
    assert g1 is not None
    assert g1.dept_code == "WTR"
    assert g1.priority == "emergency"

    # Solid Waste
    g2 = triage_grievance("Garbage dumping in open community bin overflowing with dead animal", ward_id=2)
    assert g2 is not None
    assert g2.dept_code == "SAN"
    assert g2.priority == "emergency"

    # Electrical
    g3 = triage_grievance("Streetlight not working on main junction, dark spot", ward_id=5)
    assert g3 is not None
    assert g3.dept_code == "ELE"
    assert g3.priority == "standard"
