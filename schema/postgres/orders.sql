-- PostgreSQL reference schema for orders (normalized).
-- Requires PostgreSQL 13+ for gen_random_uuid(), or enable pgcrypto for older versions.
-- Adjust FK targets (products.id, option_groups, etc.) to match your actual catalog schema.
--
-- Triggers: if CREATE TRIGGER fails, try EXECUTE PROCEDURE set_updated_at(); instead of
-- EXECUTE FUNCTION (depends on PostgreSQL version).

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(30) NOT NULL UNIQUE,

    customer_id UUID,
    assigned_driver_id UUID,

    order_type VARCHAR(20) NOT NULL CHECK (
        order_type IN ('delivery', 'pickup')
    ),

    status VARCHAR(30) NOT NULL CHECK (
        status IN (
            'placed',
            'preparing',
            'ready',
            'assigned',
            'picked_up',
            'delivered',
            'cancelled'
        )
    ),

    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    ),

    payment_method VARCHAR(30) CHECK (
        payment_method IN ('card', 'cash', 'wallet', 'other')
    ),

    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

    notes TEXT,

    placed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP,
    prepared_at TIMESTAMP,
    assigned_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    product_name VARCHAR(150) NOT NULL,
    product_description TEXT,
    product_image_url TEXT,

    category_name VARCHAR(100),
    department_name VARCHAR(100),

    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),

    line_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (line_subtotal >= 0),
    line_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_item_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,

    option_group_id UUID REFERENCES option_groups(id) ON DELETE SET NULL,
    option_choice_id UUID REFERENCES option_choices(id) ON DELETE SET NULL,

    group_name VARCHAR(120) NOT NULL,
    choice_name VARCHAR(120) NOT NULL,

    price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_item_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,

    addon_id UUID REFERENCES addons(id) ON DELETE SET NULL,

    addon_name VARCHAR(120) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),

    total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_price >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,

    recipient_name VARCHAR(120),
    phone VARCHAR(30),

    address_line_1 VARCHAR(200),
    address_line_2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    formatted_address TEXT,

    delivery_instructions TEXT,

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,

    changed_by_user_id UUID,
    changed_by_role VARCHAR(30),

    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL,

    assigned_by_user_id UUID,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_assigned_driver_id ON orders(assigned_driver_id);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_item_variants_order_item_id ON order_item_variants(order_item_id);
CREATE INDEX idx_order_item_addons_order_item_id ON order_item_addons(order_item_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_addresses_updated_at
BEFORE UPDATE ON order_addresses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
