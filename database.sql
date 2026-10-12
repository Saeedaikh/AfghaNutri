-- Create Database
CREATE DATABASE afghanutri_db;

USE afghanutri_db;


-- =====================================
-- USER TABLE
-- =====================================

CREATE TABLE user (
user_id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(100) NOT NULL,
password VARCHAR(255) NOT NULL,
email VARCHAR(150) NOT NULL UNIQUE,
gender VARCHAR(10) NOT NULL,
age INT NOT NULL,
height_cm DECIMAL(5,2) NOT NULL,
u_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
profile_picture VARCHAR(255)
);


-- =====================================
-- GOAL TABLE
-- =====================================

CREATE TABLE goal (
goal_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
goal_type ENUM('Lose','Gain','Maintain') NOT NULL,
start_weight DECIMAL(5,2) NOT NULL,
target_weight DECIMAL(5,2) NOT NULL,
time_period DECIMAL(5,2) NOT NULL,
daily_calorie_goal INT NOT NULL,
g_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
goal_status ENUM('Active','Completed','Cancelled')
NOT NULL DEFAULT 'Active',
protein_goal_g DECIMAL(6,2) NOT NULL,
carb_goal_g DECIMAL(6,2) NOT NULL,
fat_goal_g DECIMAL(6,2) NOT NULL,

FOREIGN KEY (user_id)
REFERENCES user(user_id)
ON DELETE CASCADE
);


-- =====================================
-- WATER LOG TABLE
-- =====================================

CREATE TABLE water_log (
water_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
amount_liters DECIMAL(5,2) NOT NULL,
water_log_date DATE NOT NULL,

FOREIGN KEY (user_id)
REFERENCES user(user_id)
ON DELETE CASCADE
);


-- =====================================
-- WEIGHT LOG TABLE
-- =====================================

CREATE TABLE weight_log (
weight_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
current_weight DECIMAL(5,2) NOT NULL,
record_date DATE NOT NULL,

CONSTRAINT one_weight_per_day
UNIQUE (user_id, record_date),

FOREIGN KEY (user_id)
REFERENCES user(user_id)
ON DELETE CASCADE
);


-- =====================================
-- EXERCISE TABLE
-- =====================================

CREATE TABLE exercise (
exercise_id INT AUTO_INCREMENT PRIMARY KEY,
exercise_name VARCHAR(100) NOT NULL,
met_value DECIMAL(4,2) NOT NULL,
intensity ENUM('light', 'moderate', 'vigorous') NOT NULL
);


-- =====================================
-- ACTIVITY LOG TABLE
-- =====================================

CREATE TABLE activity_log (
activity_log_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
exercise_id INT NOT NULL,
duration_minutes INT NOT NULL,
calories_burned INT NOT NULL,
activity_date DATE NOT NULL,
intensity ENUM('light','moderate','vigorous') NOT NULL,

FOREIGN KEY (user_id)
REFERENCES user(user_id)
ON DELETE CASCADE,

FOREIGN KEY (exercise_id)
REFERENCES exercise(exercise_id)
ON DELETE CASCADE
);


-- =====================================
-- FOOD TABLE
-- =====================================

CREATE TABLE food (
food_id INT AUTO_INCREMENT PRIMARY KEY,
food_name_en VARCHAR(150) NOT NULL,
food_name_da VARCHAR(150) NOT NULL,
calories_per_serving INT NOT NULL,
fat_g_per_serving DECIMAL(5,2) NOT NULL,
carbohydrate_g_per_serving DECIMAL(5,2) NOT NULL,
protein_g_per_serving DECIMAL(5,2) NOT NULL,
description VARCHAR(500) NOT NULL,
food_image VARCHAR(255) NOT NULL
);


-- =====================================
-- FOOD LOG TABLE
-- =====================================

CREATE TABLE food_log (
food_log_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
food_id INT NOT NULL,
meal_type VARCHAR(20) NOT NULL,
servings DECIMAL(4,2) NOT NULL,
log_date DATE NOT NULL,

FOREIGN KEY (user_id)
REFERENCES user(user_id)
ON DELETE CASCADE,

FOREIGN KEY (food_id)
REFERENCES food(food_id)
ON DELETE CASCADE
);


-- Insert food data
INSERT INTO food (
    food_name_en,
    food_name_da,
    calories_per_serving,
    fat_g_per_serving,
    carbohydrate_g_per_serving,
    protein_g_per_serving,
    description
)
VALUES
('Biryani', 'بریانی', 1088, 53.9, 112.4, 41.2, 'A flavorful rice dish, prepared with basmati rice, chicken, herbs, and aromatic spices.'),
('Bolani', 'بولانی', 1731, 131, 124.4, 17.8, 'A traditional Afghan flatbread, stuffed with potatoes, vegetables, herbs, and spices, then pan-fried until crispy.'),
('Macaroni', 'مکرونی', 933, 37.4, 99.2, 59.4, 'An Afghan-style pasta dish, prepared with macaroni, chicken, vegetables, tomato sauce, and flavorful spices.'),
('Sabzi', 'سبزی', 241, 19.6, 13.7, 7.9, 'A traditional vegetable dish, prepared with spinach, mixed vegetables, garlic, ginger, and salt.'),
('Dopiaza', 'دوپیازه', 819, 61.4, 18.8, 47.1, 'A flavorful meat dish, prepared with lamb or beef, onions, green peppers, tomatoes, and aromatic spices.'),
('Rice', 'برنج', 252, 14, 28.2, 2.7, 'A classic rice dish, prepared with steamed rice, a light seasoning, and a soft, fluffy texture.'),
('Beans', 'لوبیا', 687, 29, 81.5, 29, 'A hearty bean dish, prepared with kidney beans, tomatoes, onions, garlic, and simple seasonings.'),
('Lamb Liver', 'جگر', 1583, 141.7, 12.4, 64.5, 'A flavorful curry dish, prepared with lamb liver, onions, tomatoes, and traditional seasonings.'),
('Okra', 'بامیه', 491, 44.6, 22.7, 5.2, 'A flavorful vegetable dish, prepared with okra, tomatoes, onions, and simple seasonings.'),
('Shorba', 'شوربا', 1128, 105.4, 19.3, 27.3, 'A comforting soup dish, prepared with meat, vegetables, lentils, and simple seasonings.'),
('Kabuli Pulaw', 'قابلی پلو', 1725, 100.7, 156.8, 53.3, 'Afghanistan''s most iconic rice dish, prepared with seasoned rice, lamb, carrots, raisins, and aromatic spices.'),
('Chopan Kabab', 'چوپان کباب', 1036, 93, 7.4, 40.2, 'A grilled meat dish, prepared with tender lamb pieces, onions, and traditional seasonings.'),
('Fried Whole Chicken', 'مرغ سخاری', 1741, 158.7, 39.1, 40.7, 'A flavorful roasted meat dish, prepared with whole chicken and a blend of rich, spicy seasonings with a crispy outer layer.'),
('Eggplant', 'برانی بادنجان', 503, 50.4, 13.9, 2.3, 'A flavorful vegetable dish, prepared with eggplant, tomatoes, onions, garlic, and simple seasonings.'),
('Goat Leg', 'پاچه', 882, 55.4, 66.1, 37.4, 'A traditional meat dish, prepared with lamb/goat trotters, head, and slow-cooked with light seasonings.'),
('Ash (noodle soup)', 'آش', 417, 31.2, 21.9, 17.2, 'A hearty soup dish, prepared with noodles, beans, vegetables, and lightly seasoned with simple flavors.'),
('Mantu (meat dumplings)', 'منتو', 1545, 83.3, 152.1, 45.7, 'A traditional dumpling dish, prepared with steamed dough, seasoned meat, onions, and topped with yogurt sauce.'),
('Ashak (vegetable dumplings)', 'آشک', 1169, 47.3, 164, 21.7, 'A traditional dumpling dish, prepared with pasta dough, chives, and topped with yogurt sauce and flavorful meat sauce.'),
('Chapli Kabab', 'چپلی کباب', 906, 79, 10.3, 38, 'A flavorful meat dish, prepared with minced beef, tomatoes, onions, herbs, and traditional seasonings.'),
('Tikkah Kabab', 'تکه کباب', 775, 69.1, 0.01, 35.4, 'A grilled meat dish, prepared with chopped beef, lamb fat, and lightly seasoned with traditional flavors.'),
('Chicken Qorma', 'قورمه مرغ', 557, 41.2, 7.2, 38.7, 'A flavorful curry dish, prepared with chicken, onions, tomatoes, and traditional seasonings.');


-- Set food image filenames
UPDATE food 
SET food_image = CONCAT(food_name_en, '.png'); 


-- Insert exercise data
INSERT INTO exercise (exercise_name, met_value, intensity)
VALUES

-- Walking
('Walking', 3.5, 'light'),
('Walking', 3.8, 'moderate'),
('Walking', 4.8, 'vigorous'),

-- Jogging and Running
('Jogging', 7.5, 'moderate'),
('Running', 6.5, 'light'),
('Running', 8.5, 'moderate'),
('Running', 11.0, 'vigorous'),

-- Cycling
('Cycling', 4.0, 'light'),
('Cycling', 7.0, 'moderate'),
('Cycling', 10.0, 'vigorous'),

-- Conditioning Exercises
('Aerobic Exercise', 7.3, 'vigorous'),
('Step Aerobics', 5.5, 'moderate'),
('Calisthenics', 2.8, 'light'),
('Calisthenics', 3.8, 'moderate'),
('Calisthenics', 7.5, 'vigorous'),
('Jumping Rope', 11.0, 'vigorous'),

-- Sports
('Badminton', 5.5, 'moderate'),
('Basketball', 7.5, 'moderate'),
('Basketball', 8.0, 'vigorous'),
('Boxing', 5.8, 'moderate'),
('Boxing', 7.8, 'vigorous'),
('Football', 7.0, 'moderate'),
('Tennis', 7.3, 'moderate'),
('Volleyball', 4.0, 'moderate'),

-- Swimming
('Swimming', 5.8, 'moderate'),
('Swimming', 8.3, 'vigorous'),

-- Other Common Activities
('Hiking', 6.0, 'moderate'),
('Dancing', 5.5, 'moderate'),
('Yoga', 2.5, 'light'),
('Pilates', 3.0, 'light'),
('Weight Training', 3.5, 'moderate'),
('Circuit Training', 8.0, 'vigorous');