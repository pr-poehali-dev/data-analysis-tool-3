import { useState, useEffect } from "react";
import { Request, requestsStore } from "@/store/requestsStore";
import { recommendationsStore } from "@/store/recommendationsStore";

const ITEMS_PER_PAGE = 6;

export const useRequestsFilter = (currentUserEmail?: string) => {
  const [budget, setBudget] = useState([50000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);
  const [selectedHousingType, setSelectedHousingType] = useState<string | undefined>(undefined);
  const [selectedRentalPeriod, setSelectedRentalPeriod] = useState<string | undefined>(undefined);
  const [selectedRoomsCount, setSelectedRoomsCount] = useState<string | undefined>(undefined);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [budgetChanged, setBudgetChanged] = useState(false);

  useEffect(() => {
    const updateFromCache = () => {
      const allRequests = requestsStore.getRequests();
      const activeRequests = allRequests.filter(r => r.status === 'active');
      setRequests(activeRequests);
    };

    requestsStore.fetchRequests().then(() => {
      updateFromCache();
    });
    updateFromCache();

    const unsubscribe = requestsStore.subscribe(updateFromCache);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;
    recommendationsStore.fetchUserRecommendations(currentUserEmail);
    const unsubscribe = recommendationsStore.subscribe(() => {});
    return unsubscribe;
  }, [currentUserEmail]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtersApplied]);

  const availableCities = Array.from(new Set(requests.map(r => r.city).filter(Boolean))).sort();
  const availableDistricts = selectedCity
    ? Array.from(new Set(
        requests
          .filter(r => r.city === selectedCity)
          .flatMap(r => Array.isArray(r.districts) ? r.districts : [])
          .filter(Boolean)
      )).sort()
    : [];

  const getCityOptions = () => availableCities.map(city => ({ value: city, label: city }));
  const citiesWithDistrictsFromData: Record<string, string[]> = Object.fromEntries(
    availableCities.map(city => [
      city,
      Array.from(new Set(
        requests.filter(r => r.city === city).flatMap(r => Array.isArray(r.districts) ? r.districts : [])
      )).sort()
    ])
  );

  const filteredRequests = requests.filter(request => {
    if (!filtersApplied) return true;
    
    if (selectedCity && request.city !== selectedCity) return false;
    
    if (selectedDistrict) {
      const districts = Array.isArray(request.districts) ? request.districts : [];
      if (!districts.includes(selectedDistrict)) return false;
    }
    
    if (selectedHousingType && request.housingType !== selectedHousingType) return false;
    
    if (selectedRentalPeriod && request.rentalPeriod !== selectedRentalPeriod) return false;
    
    if (selectedRoomsCount) {
      const rc = request.roomsCount?.trim() || '';
      if (selectedRoomsCount === "4+") {
        const n = parseInt(rc);
        if (isNaN(n) || n < 4) return false;
      } else {
        if (rc !== selectedRoomsCount) return false;
      }
    }
    
    if (budgetChanged) {
      const budgetMax = parseInt(request.budgetMax?.replace(/\D/g, '') || '0');
      const budgetVal = parseInt(request.budget?.replace(/\D/g, '') || '0');
      const requestBudget = budgetMax || budgetVal;
      if (requestBudget > 0 && requestBudget > budget[0]) return false;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getSuggestionsCount = (requestId: string): number => {
    if (!currentUserEmail || !requestId) return 0;
    const recommendations = recommendationsStore.getRecommendations();
    return recommendations.filter(
      rec => rec.requestId === requestId && rec.userId === currentUserEmail
    ).length;
  };

  const handleApplyFilters = () => setFiltersApplied(true);

  const handleBudgetChange = (value: number[]) => {
    setBudget(value);
    setBudgetChanged(true);
  };

  const handleResetFilters = () => {
    setSelectedCity(undefined);
    setSelectedDistrict(undefined);
    setSelectedHousingType(undefined);
    setSelectedRentalPeriod(undefined);
    setSelectedRoomsCount(undefined);
    setBudget([50000]);
    setBudgetChanged(false);
    setFiltersApplied(false);
  };

  return {
    budget,
    setBudget: handleBudgetChange,
    currentPage,
    setCurrentPage,
    selectedCity,
    setSelectedCity,
    selectedDistrict,
    setSelectedDistrict,
    selectedHousingType,
    setSelectedHousingType,
    selectedRentalPeriod,
    setSelectedRentalPeriod,
    selectedRoomsCount,
    setSelectedRoomsCount,
    currentRequests,
    totalPages,
    getSuggestionsCount,
    handleApplyFilters,
    handleResetFilters,
    getCityOptions,
    citiesWithDistricts: citiesWithDistrictsFromData,
    availableDistricts,
  };
};

export default useRequestsFilter;