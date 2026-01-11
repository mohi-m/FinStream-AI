-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- app_user table
CREATE TABLE app_user (
    firebase_uid varchar(128) NOT NULL,
    email varchar(320),
    full_name varchar(255),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (firebase_uid)
);

CREATE UNIQUE INDEX uq_app_user_email ON public.app_user USING btree (email)
WHERE (email IS NOT NULL);

-- dim_ticker table
CREATE TABLE dim_ticker (
    ticker_id varchar(10) NOT NULL,
    company_name varchar(255),
    sector varchar(100),
    industry varchar(100),
    currency varchar(10),
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ticker_id)
);

-- fact_financials table
CREATE TABLE fact_financials (
    ticker_id varchar(10) NOT NULL,
    report_date date NOT NULL,
    report_type varchar(20) NOT NULL,
    total_revenue numeric(20, 2),
    net_income numeric(20, 2),
    ebitda numeric(20, 2),
    total_assets numeric(20, 2),
    total_liabilities numeric(20, 2),
    total_equity numeric(20, 2),
    cash_and_equivalents numeric(20, 2),
    operating_cash_flow numeric(20, 2),
    free_cash_flow numeric(20, 2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (
        ticker_id,
        report_date,
        report_type
    ),
    CONSTRAINT fk_ticker_fin FOREIGN KEY (ticker_id) REFERENCES dim_ticker (ticker_id),
    CONSTRAINT fact_financials_report_type_chk CHECK (
        (report_type)::text = ANY (
            (
                ARRAY[
                    'annual'::character varying,
                    'quarterly'::character varying
                ]
            )::text []
        )
    )
);

CREATE INDEX idx_fact_financials_ticker_date ON fact_financials (ticker_id, report_date);

-- fact_price_daily table
CREATE TABLE fact_price_daily (
    ticker_id varchar(10) NOT NULL,
    "date" date NOT NULL,
    "open" numeric(15, 4),
    high numeric(15, 4),
    low numeric(15, 4),
    close numeric(15, 4),
    volume bigint,
    PRIMARY KEY (ticker_id, "date"),
    CONSTRAINT fk_ticker_price FOREIGN KEY (ticker_id) REFERENCES dim_ticker (ticker_id)
);

CREATE INDEX idx_fact_price_daily_ticker_date ON fact_price_daily (ticker_id, "date");

-- user_portfolio table
CREATE TABLE user_portfolio (
    portfolio_id uuid NOT NULL DEFAULT gen_random_uuid (),
    firebase_uid varchar(128) NOT NULL,
    portfolio_name varchar(255) NOT NULL,
    base_currency varchar(10) NOT NULL DEFAULT 'USD'::character varying,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (portfolio_id),
    CONSTRAINT user_portfolio_firebase_uid_fkey FOREIGN KEY (firebase_uid) REFERENCES app_user (firebase_uid)
);

CREATE UNIQUE INDEX uq_user_portfolio_name ON public.user_portfolio USING btree (firebase_uid, portfolio_name);

CREATE INDEX idx_user_portfolio_firebase_uid ON user_portfolio (firebase_uid);

-- portfolio_holding table
CREATE TABLE portfolio_holding (
    portfolio_id uuid NOT NULL,
    ticker_id varchar(10) NOT NULL,
    quantity numeric(20, 6) NOT NULL,
    cash_balance numeric(20, 6) NOT NULL DEFAULT 0,
    notes text,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (portfolio_id, ticker_id),
    CONSTRAINT portfolio_holding_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES user_portfolio (portfolio_id),
    CONSTRAINT portfolio_holding_ticker_id_fkey FOREIGN KEY (ticker_id) REFERENCES dim_ticker (ticker_id),
    CONSTRAINT portfolio_holding_quantity_check CHECK (quantity >= (0)::numeric)
);

CREATE INDEX idx_portfolio_holding_portfolio_id ON portfolio_holding (portfolio_id);

CREATE INDEX idx_portfolio_holding_ticker_id ON portfolio_holding (ticker_id);