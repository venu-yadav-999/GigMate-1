import random, string, json
from datetime import datetime, timedelta, date
from faker import Faker
import mysql.connector
from tqdm import tqdm

fake = Faker("en_IN")
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345",
    "database": "gigmate",
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor(buffered=True)

# ---------------- UTIL ---------------- #
def rs(n=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

def phone():
    return "9" + ''.join(random.choices(string.digits, k=9))

# ---------------- MASTER SEEDS ---------------- #
def seed_master_data():

    # gig platforms
    platforms = [
        ("Zomato","food_delivery","oauth",25),
        ("Swiggy","food_delivery","oauth",22),
        ("Uber","ride_hailing","oauth",30),
        ("Rapido","ride_hailing","oauth",20),
    ]
    for p in platforms:
        cursor.execute("""INSERT IGNORE INTO gig_platforms
        (platform_name,platform_type,auth_type,commission_rate)
        VALUES (%s,%s,%s,%s)""", p)

    # earning categories
    for c in [("Delivery","delivery"),("Ride","ride"),("Bonus","bonus"),("Tip","tip")]:
        cursor.execute("INSERT IGNORE INTO earning_categories (category_name,category_type) VALUES (%s,%s)", c)

    # expense categories
    for c in [("Fuel","fuel"),("Maintenance","maintenance"),("Food","food"),("Mobile","mobile")]:
        cursor.execute("INSERT IGNORE INTO expense_categories (category_name,category_type) VALUES (%s,%s)", c)

    # cities + zones
    cities = ["Mumbai","Delhi","Bangalore","Hyderabad"]
    for city in cities:
        cursor.execute("""INSERT IGNORE INTO cities (city_name,state)
                          VALUES (%s,%s)""",(city,fake.state()))
    cursor.execute("SELECT id FROM cities")
    for cid, in cursor.fetchall():
        for i in range(3):
            cursor.execute("""INSERT IGNORE INTO zones
            (city_id,zone_name,zone_type,is_high_demand_area)
            VALUES (%s,%s,%s,%s)""",
            (cid,f"Zone-{rs(4)}",random.choice(["commercial","mixed"]),random.choice([0,1])))

    # tax slabs
    slabs=[(0,250000,0),(250000,500000,5),(500000,1000000,20),(1000000,None,30)]
    for s in slabs:
        cursor.execute("""INSERT IGNORE INTO tax_slabs
        (financial_year,regime,min_income,max_income,tax_percent)
        VALUES ('2024-2025','new',%s,%s,%s)""",s)

    # deductions
    cursor.execute("""INSERT IGNORE INTO tax_deductions
    (deduction_name,deduction_type,max_amount)
    VALUES ('80C Investment','80C',150000)""")

    # subscriptions
    cursor.execute("""INSERT IGNORE INTO subscription_plans
    (plan_name,plan_code,price_monthly)
    VALUES ('Pro','PRO',299)""")

    # courses
    cursor.execute("""INSERT IGNORE INTO courses
    (course_title,category,level,duration_hours)
    VALUES ('Financial Literacy','financial_literacy','beginner',5)""")

    # referral campaign
    cursor.execute("""INSERT IGNORE INTO referral_campaigns
    (campaign_name,referrer_reward,referee_reward,start_date)
    VALUES ('Launch Offer',100,50,CURDATE())""")

    # notification template
    cursor.execute("""INSERT IGNORE INTO notification_templates
    (template_name,template_type,message_text,category)
    VALUES ('Welcome','push','Welcome to GigMate','system')""")

# ---------------- USERS & ALL DEPENDENCIES ---------------- #
def seed_users_and_everything(n=100):
    cursor.execute("SELECT id FROM gig_platforms")
    platforms=[x[0] for x in cursor.fetchall()]
    cursor.execute("SELECT id FROM earning_categories")
    ecat=[x[0] for x in cursor.fetchall()]
    cursor.execute("SELECT id FROM expense_categories")
    xcat=[x[0] for x in cursor.fetchall()]
    cursor.execute("SELECT id FROM zones")
    zones=[x[0] for x in cursor.fetchall()]
    cursor.execute("SELECT id FROM courses")
    courses=[x[0] for x in cursor.fetchall()]
    cursor.execute("SELECT id FROM subscription_plans")
    plans=[x[0] for x in cursor.fetchall()]
    cursor.execute("SELECT id FROM referral_campaigns")
    campaign=cursor.fetchone()[0]
    cursor.execute("SELECT id FROM notification_templates")
    template=cursor.fetchone()[0]

    users=[]

    for _ in tqdm(range(n),desc="FULL SEED"):
        # USER
        cursor.execute("""INSERT INTO users
        (uid,phone_number,email,full_name,city,state,is_verified,account_status,referral_code)
        VALUES (%s,%s,%s,%s,%s,%s,1,'active',%s)""",
        (rs(12),phone(),fake.email(),fake.name(),fake.city(),fake.state(),rs(6)))
        uid=cursor.lastrowid
        users.append(uid)

        # notification prefs
        cursor.execute("""INSERT INTO user_notification_preferences
        (user_id,category) VALUES (%s,'system')""",(uid,))

        # platform profile
        pid=random.choice(platforms)
        cursor.execute("""INSERT INTO user_platform_profiles
        (user_id,platform_id,is_connected,connection_method)
        VALUES (%s,%s,1,'api')""",(uid,pid))
        upp=cursor.lastrowid

        # earnings
        for i in range(10):
            amt=random.randint(100,500)
            cursor.execute("""INSERT INTO earnings
            (user_id,platform_profile_id,earning_category_id,
             transaction_id,amount,transaction_date,sync_method,payment_status)
            VALUES (%s,%s,%s,%s,%s,%s,'api','completed')""",
            (uid,upp,random.choice(ecat),rs(12),amt,fake.date_time_this_month()))

        # expenses
        for i in range(5):
            cursor.execute("""INSERT INTO expenses
            (user_id,expense_category_id,amount,expense_date)
            VALUES (%s,%s,%s,%s)""",
            (uid,random.choice(xcat),random.randint(50,300),date.today()))

        # savings
        cursor.execute("""INSERT INTO savings_goals
        (user_id,goal_name,goal_type,target_amount)
        VALUES (%s,'Emergency','emergency',50000)""",(uid,))
        sg=cursor.lastrowid
        cursor.execute("""INSERT INTO savings_transactions
        (user_id,savings_goal_id,transaction_type,amount)
        VALUES (%s,%s,'deposit',1000)""",(uid,sg))

        # tax profile
        cursor.execute("""INSERT INTO user_tax_profiles
        (user_id,financial_year,total_income)
        VALUES (%s,'2024-2025',300000)""",(uid,))

        # course enrollment
        cid=random.choice(courses)
        cursor.execute("""INSERT INTO user_course_enrollments
        (user_id,course_id,status) VALUES (%s,%s,'in_progress')""",(uid,cid))

        # subscription
        sid=random.choice(plans)
        cursor.execute("""INSERT INTO user_subscriptions
        (user_id,plan_id,status) VALUES (%s,%s,'active')""",(uid,sid))

        # notification
        cursor.execute("""INSERT INTO notifications
        (user_id,template_id,notification_type,message,category)
        VALUES (%s,%s,'push','Welcome','system')""",(uid,template))

        # audit log
        cursor.execute("""INSERT INTO audit_logs
        (user_id,action_type,table_name)
        VALUES (%s,'CREATE','users')""",(uid,))

    # referrals
    for i in range(1,len(users)):
        cursor.execute("""INSERT IGNORE INTO referrals
        (referrer_id,referee_id,campaign_id)
        VALUES (%s,%s,%s)""",(users[i-1],users[i],campaign))

# ---------------- RUN ---------------- #
seed_master_data()
seed_users_and_everything(100)

conn.commit()
cursor.close()
conn.close()
print("DONE: ALL TABLES SEEDED SUCCESSFULLY")
