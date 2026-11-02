-- Fictional demonstration products. No real customer or payment data.
INSERT OR IGNORE INTO categories(id,name,description) VALUES
 (1,'Graphic Tees','Pop culture inspired printed shirts'),
 (2,'Hoodies','Comfortable everyday hoodies'),
 (3,'Accessories','Caps and tote bags');

INSERT OR IGNORE INTO products(id,category_id,sku,name,description,price_cents,material,size_guide) VALUES
 (1,1,'TEE-SPACE-001','Space Explorer Tee','Original space themed graphic tee.',2995,'100% cotton','S: 48 cm, M: 51 cm, L: 54 cm chest width'),
 (2,1,'TEE-ARCADE-002','Retro Arcade Tee','Original arcade inspired print.',3495,'100% cotton','S: 48 cm, M: 51 cm, L: 54 cm chest width'),
 (3,2,'HOOD-MOON-001','Moonlight Hoodie','Relaxed hoodie with original moon graphic.',6995,'80% cotton 20% polyester','M: 56 cm, L: 59 cm chest width'),
 (4,2,'HOOD-PIXEL-002','Pixel Quest Hoodie','Warm fleece hoodie with original pixel art.',7495,'80% cotton 20% polyester','M: 56 cm, L: 59 cm chest width'),
 (5,3,'CAP-STAR-001','Star Cap','Adjustable embroidered cap.',2495,'Cotton twill','One size with adjustable strap'),
 (6,3,'TOTE-COMIC-002','Comic Panel Tote','Reusable tote with original comic print.',1995,'Cotton canvas','One size 38 x 42 cm');

INSERT OR IGNORE INTO variants(id,product_id,size,colour,stock) VALUES
 (1,1,'S','Black',8),(2,1,'M','Black',15),(3,1,'L','White',4),
 (4,2,'M','Navy',12),(5,2,'L','Navy',0),
 (6,3,'M','Grey',6),(7,3,'L','Grey',9),
 (8,4,'M','Black',7),(9,4,'L','Black',3),
 (10,5,'ONE SIZE','Navy',20),(11,6,'ONE SIZE','Natural',18);

-- Fictional order history used by the storefront's sample account.
INSERT OR IGNORE INTO users(id,email,name,created_at) VALUES
 (1,'demo@popculture.com','Demo Customer','2026-10-10 09:30:00');
INSERT OR IGNORE INTO carts(id,user_id,updated_at) VALUES
 (1,1,'2026-10-25 12:00:00');
INSERT OR IGNORE INTO orders(id,user_id,status,subtotal_cents,shipping_cents,total_cents,shipping_name,address,city,postcode,created_at) VALUES
 (1001,1,'Delivered',6490,995,7485,'Demo Customer','10 Example Street','Melbourne','3000','2026-10-12 10:15:00'),
 (1002,1,'Shipped',9490,0,9490,'Demo Customer','10 Example Street','Melbourne','3000','2026-10-24 14:40:00');
INSERT OR IGNORE INTO order_items(id,order_id,product_id,variant_id,quantity,unit_price_cents) VALUES
 (1001,1001,1,2,1,2995),(1002,1001,2,4,1,3495),
 (1003,1002,3,6,1,6995),(1004,1002,5,10,1,2495);
INSERT OR IGNORE INTO order_status_history(id,order_id,status,note,created_at) VALUES
 (1001,1001,'Confirmed','Order received and confirmed','2026-10-12 10:15:00'),
 (1002,1001,'Packed','Items packed at the warehouse','2026-10-12 15:30:00'),
 (1003,1001,'Shipped','Parcel handed to the delivery carrier','2026-10-13 08:45:00'),
 (1004,1001,'Delivered','Parcel delivered successfully','2026-10-16 13:20:00'),
 (1005,1002,'Confirmed','Order received and confirmed','2026-10-24 14:40:00'),
 (1006,1002,'Packed','Items packed at the warehouse','2026-10-25 09:10:00'),
 (1007,1002,'Shipped','Parcel is on its way','2026-10-26 07:55:00');
INSERT OR IGNORE INTO payments(id,order_id,status,transaction_ref,amount_cents,created_at) VALUES
 (1001,1001,'Succeeded','DEMO-1001-SAMPLE',7485,'2026-10-12 10:15:00'),
 (1002,1002,'Succeeded','DEMO-1002-SAMPLE',9490,'2026-10-24 14:40:00');
