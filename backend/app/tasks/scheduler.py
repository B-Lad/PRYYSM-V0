from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

def maintenance_job():
    print("🔧 Scheduled maintenance task running...")

def start_scheduler():
    scheduler.add_job(maintenance_job, "interval", minutes=30)
    scheduler.start()