CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    done        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tasks (title, done) VALUES
    ('Install Jenkins', TRUE),
    ('Write the pipeline', TRUE),
    ('Scan the repo with Trivy', FALSE),
    ('Push image to Docker Hub', FALSE),
    ('Deploy to EC2', FALSE)
ON CONFLICT DO NOTHING;
