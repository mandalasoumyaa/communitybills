import sqlite3
conn = sqlite3.connect('community_bills.db')
cursor = conn.cursor()
r = cursor.execute("SELECT id, name, community_id FROM towers").fetchall()
print("TOWERS IN DB:", r)
conn.close()
