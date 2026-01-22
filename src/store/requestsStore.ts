export interface Request {
  id: string;
  name: string;
  avatar: string;
  location: string;
  budget: string;
  reward: string;
  bonus: string;
  whoWillLive: string;
  aboutYourself: string;
  hasPets: string;
  city: string;
  districts: string[];
  budgetMin: string;
  budgetMax: string;
  housingType: string;
  roomsCount: string;
  rentalPeriod: string;
  moveInDate: string;
  createdAt: Date;
}

const STORAGE_KEY = 'sovietpay_requests';

class RequestsStore {
  private listeners: Set<() => void> = new Set();

  getRequests(): Request[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return this.getInitialRequests();
    const requests = JSON.parse(stored);
    return requests.map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }));
  }

  addRequest(request: Omit<Request, 'id' | 'createdAt'>): Request {
    const newRequest: Request = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    const requests = this.getRequests();
    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    this.notifyListeners();
    
    return newRequest;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private getInitialRequests(): Request[] {
    const initial = [
      {
        id: "1",
        name: "Анна Петрова",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna",
        location: "Москва, ЦАО или ЮЗАО",
        budget: "50 000 - 70 000 ₽",
        reward: "10 000 ₽",
        bonus: "",
        whoWillLive: "Я один",
        aboutYourself: "Работаю в IT компании, предпочитаю тихие районы с хорошей инфраструктурой",
        hasPets: "Нет",
        city: "Москва",
        districts: ["ЦАО", "ЮЗАО"],
        budgetMin: "50000",
        budgetMax: "70000",
        housingType: "Квартира",
        roomsCount: "1",
        rentalPeriod: "6-12 месяцев",
        moveInDate: "2024-02-01",
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "2",
        name: "Дмитрий Соколов",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry",
        location: "Москва, САО или СВАО",
        budget: "60 000 - 80 000 ₽",
        reward: "12 000 ₽",
        bonus: "",
        whoWillLive: "Пара",
        aboutYourself: "Молодая семья, оба работаем удаленно, нужна тихая квартира с хорошим интернетом",
        hasPets: "Кошка",
        city: "Москва",
        districts: ["САО", "СВАО"],
        budgetMin: "60000",
        budgetMax: "80000",
        housingType: "Квартира",
        roomsCount: "2",
        rentalPeriod: "6-12 месяцев",
        moveInDate: "2024-02-15",
        createdAt: new Date("2024-01-16"),
      },
      {
        id: "3",
        name: "Елена Иванова",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
        location: "Москва, ЗАО или СЗАО",
        budget: "40 000 - 55 000 ₽",
        reward: "8 000 ₽",
        bonus: "",
        whoWillLive: "Я один",
        aboutYourself: "Студентка магистратуры, ищу спокойное место для учебы",
        hasPets: "Нет",
        city: "Москва",
        districts: ["ЗАО", "СЗАО"],
        budgetMin: "40000",
        budgetMax: "55000",
        housingType: "Студия",
        roomsCount: "Студия",
        rentalPeriod: "6-12 месяцев",
        moveInDate: "2024-02-10",
        createdAt: new Date("2024-01-17"),
      },
      {
        id: "4",
        name: "Сергей Морозов",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sergey",
        location: "Москва, ВАО",
        budget: "70 000 - 90 000 ₽",
        reward: "14 000 ₽",
        bonus: "",
        whoWillLive: "Семья с детьми",
        aboutYourself: "Семья из трех человек, ребенок 5 лет, нужна квартира рядом с детским садом",
        hasPets: "Нет",
        city: "Москва",
        districts: ["ВАО"],
        budgetMin: "70000",
        budgetMax: "90000",
        housingType: "Квартира",
        roomsCount: "3",
        rentalPeriod: "Более года",
        moveInDate: "2024-03-01",
        createdAt: new Date("2024-01-18"),
      },
      {
        id: "5",
        name: "Мария Кузнецова",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
        location: "Москва, ЮВАО или ЮАО",
        budget: "45 000 - 60 000 ₽",
        reward: "9 000 ₽",
        bonus: "",
        whoWillLive: "Пара",
        aboutYourself: "Переезжаем в Москву по работе, нужна квартира с мебелью",
        hasPets: "Собака",
        city: "Москва",
        districts: ["ЮВАО", "ЮАО"],
        budgetMin: "45000",
        budgetMax: "60000",
        housingType: "Квартира",
        roomsCount: "1",
        rentalPeriod: "6-12 месяцев",
        moveInDate: "2024-02-20",
        createdAt: new Date("2024-01-19"),
      },
    ];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

export const requestsStore = new RequestsStore();