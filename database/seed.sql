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
