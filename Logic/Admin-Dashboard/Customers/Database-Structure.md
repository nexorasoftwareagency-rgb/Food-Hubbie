## Database-Structure.md

customers/{phone}: { name:string, registeredAt:timestamp, ...other fields }
orders/{id}: { phone:string, total:number, ... } — used for cross-reference
