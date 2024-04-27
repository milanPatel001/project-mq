CREATE TABLE pokemon(
    id int PRIMARY KEY,
    name text,
    base_experience int,
    height int,
    weight int,
    abilities text[],
    moves text[],
    types text[],
    img text
);

CREATE TABLE generation(
	id int PRIMARY KEY,
	name text,
	moves text[],
	species text[],
	types text[]
);

CREATE TABLE move(
	id int PRIMARY KEY,
	name text,
	pp int,
	power int,
	accuracy int,
	type text,
	learned_by text[],
	generation text
);

CREATE TABLE type(
	id int PRIMARY KEY,
	name text,
	pokemons text[],
	moves text[]
);

CREATE TABLE offset_values(
	generation int PRIMARY KEY,
	moves_offset int,
	species_offset int,
	moves_offset_limit int,
	species_offset_limit int
);

INSERT INTO offset_values VALUES(1,0,0,165,151);
INSERT INTO offset_values VALUES(2,0,0,86,100);
INSERT INTO offset_values VALUES(3,0,0,121,135);
INSERT INTO offset_values VALUES(4,0,0,113,107);
INSERT INTO offset_values VALUES(5,0,0,92,156);
INSERT INTO offset_values VALUES(6,0,0,62,72);
INSERT INTO offset_values VALUES(7,0,0,121,88);
INSERT INTO offset_values VALUES(8,0,0,108,96);
INSERT INTO offset_values VALUES(9,0,0,69,120);





