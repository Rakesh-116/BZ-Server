## Users Tables

```
create table Users (
  id UUID primary key,
  username varchar(255) unique,
  password varchar(255),
  email varchar(255)
)
```

---
