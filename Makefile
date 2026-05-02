.PHONY: build up down restart logs test clean seed

build:
	mvn clean package -DskipTests

up:
	docker-compose up

down:
	docker-compose down

restart: down build up

logs:
	docker-compose logs -f

test:
	mvn test -pl services/user-service,services/catalog-service,services/inventory-service,services/search-service

clean:
	docker-compose down -v
	mvn clean

build-service:
	mvn clean package -DskipTests -pl services/$(service) --also-make

up-service:
	docker-compose up --build $(service)

restart-service:
	mvn clean package -DskipTests -pl services/$(service) --also-make && docker-compose up --build $(service)

seed:
	@./scripts/seed.sh