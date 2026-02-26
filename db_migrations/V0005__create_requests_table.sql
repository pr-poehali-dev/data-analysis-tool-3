CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    location TEXT,
    budget VARCHAR(255),
    reward VARCHAR(255),
    bonus VARCHAR(255) DEFAULT '',
    who_will_live VARCHAR(255),
    about_yourself TEXT,
    has_pets VARCHAR(255),
    city VARCHAR(255),
    districts TEXT[] DEFAULT '{}',
    budget_min VARCHAR(50),
    budget_max VARCHAR(50),
    housing_type VARCHAR(255),
    rooms_count VARCHAR(50),
    rental_period VARCHAR(255),
    move_in_date VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_user_email ON requests(user_email);
CREATE INDEX idx_requests_status ON requests(status);

INSERT INTO requests (user_email, name, avatar, location, budget, reward, bonus, who_will_live, about_yourself, has_pets, city, districts, budget_min, budget_max, housing_type, rooms_count, rental_period, move_in_date, status, created_at)
VALUES
('demo@sovetpay.ru', 'Анна Петрова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', 'Москва, ЦАО или ЮЗАО', '50 000 - 70 000 ₽', '10 000 ₽', '', 'Я один', 'Работаю в IT компании, предпочитаю тихие районы с хорошей инфраструктурой', 'Нет', 'Москва', ARRAY['ЦАО','ЮЗАО'], '50000', '70000', 'Квартира', '1', '6-12 месяцев', '2024-02-01', 'active', '2024-01-15'),
('demo@sovetpay.ru', 'Дмитрий Соколов', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry', 'Москва, САО или СВАО', '60 000 - 80 000 ₽', '12 000 ₽', '', 'Пара', 'Молодая семья, оба работаем удаленно, нужна тихая квартира с хорошим интернетом', 'Кошка', 'Москва', ARRAY['САО','СВАО'], '60000', '80000', 'Квартира', '2', '6-12 месяцев', '2024-02-15', 'active', '2024-01-16'),
('demo@sovetpay.ru', 'Елена Иванова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', 'Москва, ЗАО или СЗАО', '40 000 - 55 000 ₽', '8 000 ₽', '', 'Я один', 'Студентка магистратуры, ищу спокойное место для учебы', 'Нет', 'Москва', ARRAY['ЗАО','СЗАО'], '40000', '55000', 'Студия', 'Студия', '6-12 месяцев', '2024-02-10', 'active', '2024-01-17'),
('demo@sovetpay.ru', 'Сергей Морозов', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sergey', 'Москва, ВАО', '70 000 - 90 000 ₽', '14 000 ₽', '', 'Семья с детьми', 'Семья из трех человек, ребенок 5 лет, нужна квартира рядом с детским садом', 'Нет', 'Москва', ARRAY['ВАО'], '70000', '90000', 'Квартира', '3', 'Более года', '2024-03-01', 'in_progress', '2024-01-18'),
('demo@sovetpay.ru', 'Мария Кузнецова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', 'Москва, ЮВАО или ЮАО', '45 000 - 60 000 ₽', '9 000 ₽', '', 'Пара', 'Переезжаем в Москву по работе, нужна квартира с мебелью', 'Собака', 'Москва', ARRAY['ЮВАО','ЮАО'], '45000', '60000', 'Квартира', '1', '6-12 месяцев', '2024-02-20', 'active', '2024-01-19');