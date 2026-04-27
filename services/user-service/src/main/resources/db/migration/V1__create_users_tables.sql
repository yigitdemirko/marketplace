CREATE TABLE users
(
    id           VARCHAR(36) PRIMARY KEY,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    account_type VARCHAR(20)  NOT NULL,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP
);

CREATE TABLE buyer_profiles
(
    id         VARCHAR(36) PRIMARY KEY,
    user_id    VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name  VARCHAR(100),
    phone      VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_buyer_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE seller_profiles
(
    id          VARCHAR(36) PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL UNIQUE,
    store_name  VARCHAR(255),
    tax_number  VARCHAR(50),
    phone       VARCHAR(20),
    approved    BOOLEAN     NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users (id)
);