"""Resolve a Student's class/section display names — always via ClassMaster/
SectionMaster, never the raw stored id or (for older rows) literal text.

Student.class_name stores a ClassMaster id; Student.section stores a
SectionMaster id directly (NOT a ClassSectionMaster id — that table only maps
"which sections exist for a class", it doesn't identify a specific student's
section). Older rows predating this id-based scheme may still hold the
literal display text, so each resolver falls back to a name match."""
from .models import ClassMaster, SectionMaster


def get_class_master_for_student(student):
    class_master = None
    if str(student.class_name).isdigit():
        class_master = ClassMaster.objects.filter(
            id=student.class_name, session=student.session
        ).first()
    if class_master is None:
        class_master = ClassMaster.objects.filter(
            class_name=student.class_name, session=student.session
        ).first()
    return class_master


def get_section_master_for_student(student):
    section_master = None
    if str(student.section).isdigit():
        section_master = SectionMaster.objects.filter(id=student.section).first()
    if section_master is None:
        section_master = SectionMaster.objects.filter(section=student.section).first()
    return section_master


def resolve_student_class_section(student):
    """Display-ready (class_name, section_name) for a student."""
    class_master = get_class_master_for_student(student)
    section_master = get_section_master_for_student(student)
    return (
        class_master.class_name if class_master else student.class_name,
        section_master.section if section_master else student.section,
    )


def class_name_lookup_map(session=None):
    """{raw class_name value (id or legacy text) -> resolved display name}.

    For bulk resolution of grouped/aggregated query results where calling
    resolve_student_class_section per-student isn't practical (e.g. .values()
    GROUP BY queries already collapsed to raw class_name/section values).
    """
    classes = ClassMaster.objects.filter(session=session) if session else ClassMaster.objects.all()
    mapping = {}
    for c in classes:
        mapping[str(c.id)] = c.class_name
        mapping.setdefault(c.class_name, c.class_name)
    return mapping


def section_name_lookup_map():
    """{raw section value (id or legacy text) -> resolved display name}."""
    mapping = {}
    for s in SectionMaster.objects.all():
        mapping[str(s.id)] = s.section
        mapping.setdefault(s.section, s.section)
    return mapping
