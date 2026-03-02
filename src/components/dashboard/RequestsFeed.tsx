import { useNavigate } from "react-router-dom";
import { Request } from "@/store/requestsStore";
import { citiesWithDistricts, getCityOptions } from "@/data/citiesWithDistricts";
import { useRequestsFilter } from "@/hooks/useRequestsFilter";
import { RequestsFeedFilters } from "./feed/RequestsFeedFilters";
import { RequestCard } from "./feed/RequestCard";
import { RequestsPagination } from "./feed/RequestsPagination";

interface RequestsFeedProps {
  onRegisterClick?: () => void;
  onSuggestProperty?: (requestId?: string, requestName?: string) => void;
  isAuthenticated?: boolean;
  currentUserEmail?: string;
}

export const RequestsFeed = ({ onRegisterClick, onSuggestProperty, isAuthenticated = false, currentUserEmail }: RequestsFeedProps = {}) => {
  const navigate = useNavigate();

  const {
    budget, setBudget,
    currentPage, setCurrentPage,
    selectedCity, setSelectedCity,
    selectedDistrict, setSelectedDistrict,
    selectedHousingType, setSelectedHousingType,
    selectedRentalPeriod, setSelectedRentalPeriod,
    selectedRoomsCount, setSelectedRoomsCount,
    currentRequests, totalPages,
    getSuggestionsCount,
    handleApplyFilters, handleResetFilters,
  } = useRequestsFilter(currentUserEmail);

  const handleSuggestClick = (request?: Request) => {
    if (!isAuthenticated && onRegisterClick) {
      onRegisterClick();
      return;
    }
    
    if (onSuggestProperty) {
      onSuggestProperty(request?.id, request?.name);
    } else {
      navigate("/suggest-property", {
        state: {
          requestId: request?.id,
          requestName: request?.name,
          fromDashboard: false
        }
      });
    }
  };

  return (
    <div className="space-y-3">
      <RequestsFeedFilters
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        selectedHousingType={selectedHousingType}
        setSelectedHousingType={setSelectedHousingType}
        selectedRoomsCount={selectedRoomsCount}
        setSelectedRoomsCount={setSelectedRoomsCount}
        selectedRentalPeriod={selectedRentalPeriod}
        setSelectedRentalPeriod={setSelectedRentalPeriod}
        budget={budget}
        setBudget={setBudget}
        getCityOptions={getCityOptions}
        citiesWithDistricts={citiesWithDistricts}
        handleApplyFilters={handleApplyFilters}
        handleResetFilters={handleResetFilters}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRequests.map((request, index) => (
          <RequestCard
            key={request.id}
            request={request}
            index={index}
            handleSuggestClick={handleSuggestClick}
            suggestionsCount={getSuggestionsCount(request.id)}
            fromDashboard={isAuthenticated}
            currentUserEmail={currentUserEmail}
          />
        ))}
      </div>

      <RequestsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};