CREATE TABLE saved_addresses
(
    id            VARCHAR(36) PRIMARY KEY,
    user_id       VARCHAR(36)  NOT NULL,
    title         VARCHAR(100) NOT NULL,
    full_name     VARCHAR(200) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    postal_code   VARCHAR(20)  NOT NULL,
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP,
    CONSTRAINT fk_saved_address_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_saved_addresses_user_id ON saved_addresses (user_id);

CREATE TABLE saved_cards
(
    id           VARCHAR(36) PRIMARY KEY,
    user_id      VARCHAR(36)  NOT NULL,
    alias        VARCHAR(100) NOT NULL,
    card_holder  VARCHAR(200) NOT NULL,
    last4        CHAR(4)      NOT NULL,
    expire_month CHAR(2)      NOT NULL,
    expire_year  VARCHAR(4)   NOT NULL,
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP,
    CONSTRAINT fk_saved_card_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_saved_cards_user_id ON saved_cards (user_id);
