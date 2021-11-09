from sqlalchemy.orm import Session
from datetime import timedelta
from time import process_time
import db.crud_jobs as crud
from . import validation
from . import seed
from models.jobs import JobType, JobStatus
import util.storage as storage


def print_log_start(message):
    print(message)
    return process_time()


def print_log_done(message, start_time):
    elapsed_time = process_time() - start_time
    elapsed_time = str(timedelta(seconds=elapsed_time)).split(".")[0]
    print(f"{message} DONE IN {elapsed_time}")


def run_seed(session: Session, jobs: dict):
    start_time = print_log_start("DATA SEEDER STARTED")
    info = jobs["info"]
    data = seed.seed(session=session,
                     file=storage.download(jobs["payload"]),
                     user=jobs["created_by"],
                     form=info["form_id"])
    status = JobStatus.done if len(data) else JobStatus.failed
    if (data):
        info.update({"records": len(data)})
    jobs = crud.update(session=session,
                       id=jobs["id"],
                       status=status,
                       info=info)
    print_log_done(f"SEEDER: {status}", start_time)


def run_validate(session: Session, jobs: dict):
    info = jobs["info"]
    start_time = print_log_start("DATA VALIDATION STARTED")
    error = validation.validate(session=session,
                                form=info["form_id"],
                                administration=info["administration"],
                                file=storage.download(jobs["payload"]))
    if len(error):
        print(error)
    else:
        id = jobs["id"]
        print(f"JOBS #{id} NO ERROR")
    status = JobStatus.failed if len(error) else None
    jobs = crud.update(session=session,
                       id=jobs["id"],
                       type=None if len(error) else JobType.seed_data,
                       status=status)
    print_log_done(f"VALIDATION {status}", start_time)
    if len(error) == 0:
        run_seed(session=session, jobs=jobs)


def do_task(session: Session, jobs):
    if jobs["type"] == JobType.validate_data:
        run_validate(session=session, jobs=jobs)
    if jobs["type"] == JobType.seed_data:
        run_seed(session=session, jobs=jobs)
    return True
