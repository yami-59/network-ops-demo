from enum import Enum

class Status(str, Enum):
    PENDING = "PENDING"
    PLANNED = "PLANNED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"

class Department(str, Enum):
    ENGINEERING = "ENGINEERING"
    PILOTAGE = "PILOTAGE"
    OPERATIONS = "OPERATIONS"

ALLOWED_TRANSITIONS = {
    Status.PENDING: {Status.PLANNED},
    Status.PLANNED: {Status.EXECUTED, Status.FAILED},
    Status.FAILED: {Status.PLANNED},
    Status.EXECUTED: set(),
}

STATUS_LABEL_FR = {
    Status.PENDING: "En attente",
    Status.PLANNED: "Planifiée",
    Status.EXECUTED: "Exécutée",
    Status.FAILED: "En échec",
}

DEPT_LABEL_FR = {
    Department.ENGINEERING: "Engineering",
    Department.PILOTAGE: "Pilotage",
    Department.OPERATIONS: "Operations",
}
