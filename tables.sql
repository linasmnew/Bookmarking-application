CREATE DATABASE bookmark;

create table bookmark(id int AUTO_INCREMENT NOT NULL, url varchar(300) NOT NULL, tags varchar(100), dateAdded timestamp NOT NULL,
  user_id int NOT NULL, number_of_tags int NOT NULL, category varchar(200) NOT NULL, PRIMARY KEY(id));

CREATE TABLE topic(id int AUTO_INCREMENT NOT NULL, name varchar(200) NOT NULL, user_id int NOT NULL, PRIMARY KEY(id));

CREATE TABLE user(id int AUTO_INCREMENT NOT NULL, username varchar(32) NOT NULL, email varchar(320) NOT NULL,
password varchar(255) NOT NULL, authToken varchar(255) NOT NULL, verified tinyint(1) NOT NULL DEFAULT 0,
account_type varchar(8) NOT NULL DEFAULT 'private', PRIMARY KEY(id));
