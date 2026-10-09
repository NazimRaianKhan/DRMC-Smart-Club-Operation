import re
f=open('src/db/schema.ts', 'r')
c=f.read()
f.close()
c = re.sub(r'userId: uuid\(''user_id''\).references\(\(\) => users.id\).notNull\(\),', 'userId: uuid(\'user_id\').references(() => users.id).notNull(),\n  houseId: uuid(\'house_id\').references(() => houses.id),', c)
f=open('src/db/schema.ts', 'w')
f.write(c)
f.close()

