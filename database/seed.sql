-- Fictional demonstration products. No real customer or payment data.
INSERT OR IGNORE INTO categories(id,name,description) VALUES
 (1,'T-Shirts','Pop culture inspired everyday T-shirts'),
 (2,'Hoodies','Comfortable everyday hoodies'),
 (3,'Caps & Bags','Caps and practical everyday bags'),
 (4,'Shirts','Relaxed shirts and clean overshirts'),
 (5,'Pants','Comfortable everyday pants'),
 (6,'Shoes','Versatile street-ready footwear');
UPDATE categories SET name='T-Shirts', description='Pop culture inspired everyday T-shirts' WHERE id=1;
UPDATE categories SET name='Caps & Bags', description='Caps and practical everyday bags' WHERE id=3;

INSERT OR IGNORE INTO products(id,category_id,sku,name,description,price_cents,material,size_guide) VALUES
 (1,1,'TEE-SPACE-001','Space Explorer Tee','Original space themed graphic tee.',2995,'100% cotton','S: 48 cm, M: 51 cm, L: 54 cm chest width'),
 (2,1,'TEE-ARCADE-002','Retro Arcade Tee','Original arcade inspired print.',3495,'100% cotton','S: 48 cm, M: 51 cm, L: 54 cm chest width'),
 (3,2,'HOOD-MOON-001','Moonlight Hoodie','Relaxed hoodie with original moon graphic.',6995,'80% cotton 20% polyester','M: 56 cm, L: 59 cm chest width'),
 (4,2,'HOOD-PIXEL-002','Pixel Quest Hoodie','Warm fleece hoodie with original pixel art.',7495,'80% cotton 20% polyester','M: 56 cm, L: 59 cm chest width'),
 (5,3,'CAP-STAR-001','Star Cap','Adjustable embroidered cap.',2495,'Cotton twill','One size with adjustable strap'),
 (6,3,'TOTE-COMIC-002','Comic Panel Tote','Reusable tote with original comic print.',1995,'Cotton canvas','One size 38 x 42 cm'),
 (7,4,'SHIRT-CAMP-001','Camp Collar Shirt','Relaxed short-sleeve shirt with an easy open collar.',5995,'100% cotton','S: 52 cm, M: 55 cm, L: 58 cm chest width'),
 (8,4,'SHIRT-OXFORD-002','Everyday Oxford Shirt','A clean button-up shirt for workdays and weekends.',6495,'Cotton oxford','S: 51 cm, M: 54 cm, L: 57 cm chest width'),
 (9,5,'PANT-CARGO-001','Utility Cargo Pants','Straight-leg cargo pants with practical pocket detailing.',7995,'Cotton twill','S: 76 cm, M: 82 cm, L: 88 cm waist'),
 (10,5,'PANT-WIDE-002','Relaxed Wide Pants','Soft wide-leg pants designed for all-day comfort.',7495,'Cotton blend','S: 74 cm, M: 80 cm, L: 86 cm waist'),
 (11,6,'SHOE-RUNNER-001','Street Runner','Lightweight everyday sneakers with cushioned support.',8995,'Textile and rubber','EU 40: AU 7, EU 41: AU 8, EU 42: AU 9'),
 (12,6,'SHOE-COURT-002','Classic Court Sneaker','Clean low-profile sneakers with a durable rubber sole.',8495,'Synthetic leather and rubber','EU 40: AU 7, EU 41: AU 8, EU 42: AU 9'),
 (13,3,'CAP-LOGO-002','Core Logo Cap','Minimal six-panel cap with an adjustable back strap.',2795,'Cotton twill','One size with adjustable strap'),
 (14,1,'TEE-CORE-003','Core Heavyweight Tee','Premium heavyweight T-shirt with a relaxed silhouette.',3295,'Heavyweight cotton','S: 50 cm, M: 53 cm, L: 56 cm chest width'),
 (15,1,'TEE-OVERSIZED-004','Oversized Graphic Tee','Relaxed heavyweight tee with an original city-night graphic.',3995,'240gsm cotton','S: 54 cm, M: 57 cm, L: 60 cm chest width'),
 (16,2,'HOOD-ZIP-003','Essential Zip Hoodie','Clean full-zip hoodie with a brushed fleece interior.',7995,'Cotton blend fleece','S: 54 cm, M: 57 cm, L: 60 cm chest width'),
 (17,3,'BAG-CROSSBODY-003','Utility Crossbody Bag','Compact everyday bag with adjustable strap and secure pockets.',4495,'Recycled nylon','One size with adjustable strap'),
 (18,4,'SHIRT-OVERSHIRT-003','Check Overshirt','Midweight checked overshirt designed for easy layering.',6995,'Brushed cotton','S: 53 cm, M: 56 cm, L: 59 cm chest width'),
 (19,5,'PANT-CHINO-003','Tapered Chino Pants','Versatile tapered pants with a clean everyday finish.',6995,'Cotton stretch twill','S: 76 cm, M: 82 cm, L: 88 cm waist'),
 (20,6,'SHOE-HIGHTOP-003','Canvas High Top','Classic high-top canvas sneakers with contrast rubber sole.',7995,'Canvas and rubber','S: AU 7, M: AU 8, L: AU 9');

INSERT OR IGNORE INTO variants(id,product_id,size,colour,stock) VALUES
 (1,1,'S','Black',8),(2,1,'M','Black',15),(3,1,'L','White',4),
 (4,2,'M','Navy',12),(5,2,'L','Navy',0),
 (6,3,'M','Grey',6),(7,3,'L','Grey',9),
 (8,4,'M','Black',7),(9,4,'L','Black',3),
 (10,5,'ONE SIZE','Navy',20),(11,6,'ONE SIZE','Natural',18),
 (12,7,'S','Olive',9),(13,7,'M','Olive',14),(14,7,'L','Olive',8),
 (15,8,'S','Sky Blue',7),(16,8,'M','Sky Blue',12),(17,8,'L','Sky Blue',6),
 (18,9,'S','Black',10),(19,9,'M','Black',16),(20,9,'L','Black',9),
 (21,10,'S','Stone',8),(22,10,'M','Stone',13),(23,10,'L','Stone',7),
 (24,11,'S','Black',6),(25,11,'M','Black',11),(26,11,'L','Black',8),
 (27,12,'S','White',7),(28,12,'M','White',12),(29,12,'L','White',7),
 (30,13,'ONE SIZE','Black',22),
 (31,14,'S','White',11),(32,14,'M','White',18),(33,14,'L','White',10),
 (34,15,'S','Washed Black',9),(35,15,'M','Washed Black',14),(36,15,'L','Washed Black',8),
 (37,16,'S','Charcoal',7),(38,16,'M','Charcoal',12),(39,16,'L','Charcoal',6),
 (40,17,'ONE SIZE','Black',18),
 (41,18,'S','Rust Check',6),(42,18,'M','Rust Check',10),(43,18,'L','Rust Check',5),
 (44,19,'S','Sand',9),(45,19,'M','Sand',13),(46,19,'L','Sand',8),
 (47,20,'S','Black',7),(48,20,'M','Black',11),(49,20,'L','Black',6);

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
