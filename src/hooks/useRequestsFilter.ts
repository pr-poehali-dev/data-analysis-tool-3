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

  const filteredRequests = requests.filter(request => {
    if (!filtersApplied) return true;
    
    if (selectedCity && request.city !== selectedCity) return false;
    if (selectedDistrict && request.district !== selectedDistrict) return false;
    if (selectedHousingType && request.housingType !== selectedHousingType) return false;
    
    if (selectedRentalPeriod) {
      const requestMonths = parseInt(request.rentalPeriod);
      if (selectedRentalPeriod === "1-3") {
        if (isNaN(requestMonths) || requestMonths < 1 || requestMonths > 3) return false;
      } else if (selectedRentalPeriod === "3-6") {
        if (isNaN(requestMonths) || requestMonths < 3 || requestMonths > 6) return false;
      } else if (selectedRentalPeriod === "6-12") {
        if (isNaN(requestMonths) || requestMonths < 6 || requestMonths > 12) return false;
      } else if (selectedRentalPeriod === "12+") {
        if (isNaN(requestMonths) || requestMonths <= 12) return false;
      }
    }
    
    if (selectedRoomsCount) {
      const requestRooms = parseInt(request.roomsCount?.replace(/\D/g, '') || '0');
      if (selectedRoomsCount === "4+") {
        if (requestRooms < 4) return false;
      } else {
        const filterRooms = parseInt(selectedRoomsCount);
        if (requestRooms !== filterRooms) return false;
      }
    }
    
    const requestBudget = parseInt(request.budgetMax?.replace(/\D/g, '') || request.budget?.replace(/\D/g, '') || '0');
    if (requestBudget > budget[0]) return false;
    
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

  const handleResetFilters = () => {
    setSelectedCity(undefined);
    setSelectedDistrict(undefined);
    setSelectedHousingType(undefined);
    setSelectedRentalPeriod(undefined);
    setSelectedRoomsCount(undefined);
    setBudget([50000]);
    setFiltersApplied(false);
  };

  return {
    budget,
    setBudget,
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
  };
};

export default useRequestsFilter;
