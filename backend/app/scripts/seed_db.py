"""Seed database with initial data"""
import asyncio
import sys, os
sys.path.insert(0, '/app')
os.chdir('/app')

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

CREATE_TABLES = [
    """CREATE TABLE IF NOT EXISTS machines (
        id VARCHAR(36) PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL DEFAULT 'comp_a1b2c3',
        name VARCHAR(100) NOT NULL, tech VARCHAR(50) NOT NULL, model VARCHAR(100), wc VARCHAR(100),
        status VARCHAR(50) DEFAULT 'idle', job VARCHAR(100), pct FLOAT DEFAULT 0, remaining VARCHAR(100),
        oee FLOAT DEFAULT 0, avail FLOAT DEFAULT 0, perf FLOAT DEFAULT 0, qual FLOAT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL DEFAULT 'comp_a1b2c3',
        name VARCHAR(255) NOT NULL, dept VARCHAR(50) NOT NULL, priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(50) DEFAULT 'active', wos INT DEFAULT 0, budget FLOAT DEFAULT 0, spent FLOAT DEFAULT 0,
        due VARCHAR(50), owner VARCHAR(100), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS work_orders (
        id VARCHAR(36) PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL DEFAULT 'comp_a1b2c3',
        project_id VARCHAR(36), part VARCHAR(255) NOT NULL, tech VARCHAR(50) NOT NULL, material VARCHAR(100),
        qty INT DEFAULT 1, status VARCHAR(50) DEFAULT 'planned', priority VARCHAR(20) DEFAULT 'normal',
        machine_id VARCHAR(36), due VARCHAR(50), requestor VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL DEFAULT 'comp_a1b2c3',
        email VARCHAR(255) NOT NULL, name VARCHAR(255), role VARCHAR(50) DEFAULT 'viewer',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())""",
]

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Create tables
        for sql in CREATE_TABLES:
            await conn.execute(text(sql))
        
        # Check if seeded
        r = await conn.execute(text("SELECT COUNT(*) FROM machines"))
        if r.scalar() > 0:
            print("✅ Already seeded")
            await engine.dispose()
            return
        
        print("🌱 Seeding database...")
        
        # Insert machines
        for m in [
            ("M01","Ender Pro 1","FDM","Creality Ender-7","FDM Bay A","running","WO-2041",68,"2h 14m",81,88,92,95),
            ("M02","Bambu X1-C","FDM","Bambu X1 Carbon","FDM Bay A","running","WO-2044",34,"4h 52m",76,85,89,94),
            ("M03","Ender Pro 2","FDM","Creality Ender-7","FDM Bay B","idle",None,0,None,84,91,92,97),
            ("M04","Form 4 Alpha","SLA","Formlabs Form 4","SLA Station 1","running","WO-2038",91,"0h 28m",88,93,94,97),
            ("M05","Form 4 Beta","SLA","Formlabs Form 4","SLA Station 1","error","WO-2039",45,"ERR",72,78,88,95),
            ("M06","EOS P396","SLS","EOS Formiga P396","SLS Bay","running","WO-2036",55,"6h 10m",79,86,91,93),
            ("M07","Fuse 1+","SLS","Formlabs Fuse 1+","SLS Bay","waiting","WO-2048",0,"Waiting powder",68,74,90,96),
        ]:
            await conn.execute(text("""INSERT INTO machines VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11,:12,:13,:14,NOW(),NOW())"""),
                {"1":m[0],"2":"comp_a1b2c3","3":m[1],"4":m[2],"5":m[3],"6":m[4],"7":m[5],"8":m[6],"9":m[7],"10":m[8],"11":m[9],"12":m[10],"13":m[11],"14":m[12]})
        
        # Insert projects
        for p in [
            ("PRJ-011","Falcon Wing Bracket Rev 4","ENG","urgent","active",4,28000,18400,"2025-07-22","Arjun S."),
            ("PRJ-009","Biocompatible Housing v2","RND","high","active",3,45000,22100,"2025-07-30","Dr. Priya N."),
            ("PRJ-008","Consumer Handle Concept C","DES","normal","active",2,8000,4200,"2025-08-05","Lena K."),
            ("PRJ-012","Jig & Fixture Set Mk3","MFG","urgent","active",6,18000,16200,"2025-07-18","Marco R."),
            ("PRJ-010","Alpha Unit Prototype","NPI","high","active",5,32000,19800,"2025-07-28","Yuki T."),
        ]:
            await conn.execute(text("INSERT INTO projects (id,tenant_id,name,dept,priority,status,wos,budget,spent,due,owner) VALUES (:id,'comp_a1b2c3',:name,:dept,:pri,:sta,:wos,:bud,:spe,:due,:own)"),
                {"id":p[0],"name":p[1],"dept":p[2],"pri":p[3],"sta":p[4],"wos":p[5],"bud":p[6],"spe":p[7],"due":p[8],"own":p[9]})
        
        # Insert work orders
        for w in [
            ("WO-2041","PRJ-011","Bracket Assy Rev4-A","FDM","PETG-CF",4,"production","urgent","M01","2025-07-18","Arjun S."),
            ("WO-2044","PRJ-009","Bio Housing Upper Shell","FDM","PLA-M Medical",2,"production","high","M02","2025-07-17","Dr. Priya N."),
            ("WO-2038","PRJ-011","Turbine Shroud Jig","SLA","Rigid 10K",1,"production","urgent","M04","2025-07-19","Arjun S."),
            ("WO-2039","PRJ-010","Alpha Lens Holder x8","SLA","Model V2 Resin",8,"production","high","M05","2025-07-16","Yuki T."),
            ("WO-2036","PRJ-012","Fixture Block Set","SLS","PA12 GF",12,"production","urgent","M06","2025-07-20","Marco R."),
            ("WO-2048","PRJ-010","Alpha Enclosure Lid","SLS","PA12 Natural",20,"scheduled","high","M07","2025-07-22","Yuki T."),
        ]:
            await conn.execute(text("INSERT INTO work_orders (id,tenant_id,project_id,part,tech,material,qty,status,priority,machine_id,due,requestor) VALUES (:id,'comp_a1b2c3',:pid,:part,:tech,:mat,:qty,:sta,:pri,:mid,:due,:req)"),
                {"id":w[0],"pid":w[1],"part":w[2],"tech":w[3],"mat":w[4],"qty":w[5],"sta":w[6],"pri":w[7],"mid":w[8],"due":w[9],"req":w[10]})
        
        # Insert users
        for u in [
            ("user_001","admin@company.com","Bhavin Sharma","AM Admin"),
            ("user_002","coordinator@company.com","Arjun Sharma","Coordinator"),
            ("user_003","operator@company.com","Marco Russo","Operator"),
        ]:
            await conn.execute(text("INSERT INTO users (id,tenant_id,email,name,role) VALUES (:id,'comp_a1b2c3',:email,:name,:role)"),
                {"id":u[0],"email":u[1],"name":u[2],"role":u[3]})
        
        print("✅ Seeded: 7 machines, 5 projects, 6 work orders, 3 users")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
