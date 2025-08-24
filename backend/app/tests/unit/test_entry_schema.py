# filepath: backend/app/tests/unit/test_entry_fixed_schema_py.py
"""
Comprehensive tests for the entry_schema.py file.
Tests all Pydantic models and their validation logic.
"""
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError, BaseModel

from app.schemas.entry_schema import (
    EntryBase,
    EntryCreate,
    EntryUpdate,
    EntryInDB,
    EntryResponse,
    EntrySummary,
    CategoryDistribution,
    CategoryDistributionList,
)


class TestEntryBase:
    """Test cases for EntryBase schema."""

    def test_entry_base_valid_complete(self):
        """Test EntryBase with all fields."""
        entry_data = {
            "amount": 100.50,
            "description": "Test expense",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "food",
            "subcategory": "restaurant",
            "is_recurring": True,
        }
        entry = EntryBase(**entry_data)
        assert entry.amount == 100.50
        assert entry.description == "Test expense"
        assert entry.type == "EXPENSE"
        assert entry.category == "food"
        assert entry.subcategory == "restaurant"
        assert entry.is_recurring is True

    def test_entry_base_minimal_required(self):
        """Test EntryBase with minimal required fields."""
        entry_data = {
            "amount": 50.0,
            "description": "Minimal entry",
            "date": datetime.now(timezone.utc),
            "type": "INCOME",
            "category": "salary",
        }
        entry = EntryBase(**entry_data)
        assert entry.amount == 50.0
        assert entry.description == "Minimal entry"
        assert entry.type == "INCOME"
        assert entry.category == "salary"
        assert entry.subcategory is None
        assert entry.is_recurring is False

    def test_entry_base_income_type(self):
        """Test EntryBase with INCOME type."""
        entry_data = {
            "amount": 2500.0,
            "description": "Monthly salary",
            "date": datetime.now(timezone.utc),
            "type": "INCOME",
            "category": "work",
        }
        entry = EntryBase(**entry_data)
        assert entry.type == "INCOME"

    def test_entry_base_expense_type(self):
        """Test EntryBase with EXPENSE type."""
        entry_data = {
            "amount": 150.0,
            "description": "Grocery shopping",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "food",
        }
        entry = EntryBase(**entry_data)
        assert entry.type == "EXPENSE"

    def test_entry_base_invalid_type(self):
        """Test EntryBase with invalid type."""
        entry_data = {
            "amount": 100.0,
            "description": "Invalid type",
            "date": datetime.now(timezone.utc),
            "type": "INVALID",
            "category": "test",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryBase(**entry_data)

        errors = exc_info.value.errors()
        assert any("type" in str(error) for error in errors)

    def test_entry_base_missing_amount(self):
        """Test EntryBase with missing amount."""
        entry_data = {
            "description": "Missing amount",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryBase(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("amount",) for error in errors)

    def test_entry_base_missing_description(self):
        """Test EntryBase with missing description."""
        entry_data = {
            "amount": 100.0,
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryBase(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("description",) for error in errors)

    def test_entry_base_missing_date(self):
        """Test EntryBase with missing date."""
        entry_data = {
            "amount": 100.0,
            "description": "Missing date",
            "type": "EXPENSE",
            "category": "test",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryBase(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("date",) for error in errors)

    def test_entry_base_missing_category(self):
        """Test EntryBase with missing category."""
        entry_data = {
            "amount": 100.0,
            "description": "Missing category",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryBase(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("category",) for error in errors)

    def test_entry_base_zero_amount(self):
        """Test EntryBase with zero amount (should be allowed in base)."""
        entry_data = {
            "amount": 0.0,
            "description": "Zero amount",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        entry = EntryBase(**entry_data)
        assert entry.amount == 0.0

    def test_entry_base_negative_amount(self):
        """Test EntryBase with negative amount (should be allowed in base)."""
        entry_data = {
            "amount": -50.0,
            "description": "Negative amount",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        entry = EntryBase(**entry_data)
        assert entry.amount == -50.0

    def test_entry_base_float_precision(self):
        """Test EntryBase with high precision float."""
        entry_data = {
            "amount": 123.456789,
            "description": "High precision",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        entry = EntryBase(**entry_data)
        assert entry.amount == 123.456789


class TestEntryCreate:
    """Test cases for EntryCreate schema."""

    def test_entry_create_valid(self):
        """Test EntryCreate with valid positive amount."""
        entry_data = {
            "amount": 100.0,
            "description": "Valid entry",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        entry = EntryCreate(**entry_data)
        assert entry.amount == 100.0

    def test_entry_create_inherits_from_entry_base(self):
        """Test that EntryCreate inherits from EntryBase."""
        assert issubclass(EntryCreate, EntryBase)

    def test_entry_create_zero_amount_invalid(self):
        """Test EntryCreate with zero amount (should be invalid)."""
        entry_data = {
            "amount": 0.0,
            "description": "Zero amount",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryCreate(**entry_data)

        errors = exc_info.value.errors()
        assert any("maior que zero" in str(error) for error in errors)

    def test_entry_create_negative_amount_invalid(self):
        """Test EntryCreate with negative amount (should be invalid)."""
        entry_data = {
            "amount": -50.0,
            "description": "Negative amount",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryCreate(**entry_data)

        errors = exc_info.value.errors()
        assert any("maior que zero" in str(error) for error in errors)

    def test_entry_create_very_small_positive_amount(self):
        """Test EntryCreate with very small positive amount."""
        entry_data = {
            "amount": 0.01,
            "description": "Small amount",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        entry = EntryCreate(**entry_data)
        assert entry.amount == 0.01

    def test_entry_create_large_amount(self):
        """Test EntryCreate with very large amount."""
        entry_data = {
            "amount": 999999.99,
            "description": "Large amount",
            "date": datetime.now(timezone.utc),
            "type": "INCOME",
            "category": "investment",
        }
        entry = EntryCreate(**entry_data)
        assert entry.amount == 999999.99

    def test_entry_create_income_type(self):
        """Test EntryCreate with INCOME type."""
        entry_data = {
            "amount": 3000.0,
            "description": "Salary income",
            "date": datetime.now(timezone.utc),
            "type": "INCOME",
            "category": "salary",
        }
        entry = EntryCreate(**entry_data)
        assert entry.type == "INCOME"

    def test_entry_create_with_subcategory(self):
        """Test EntryCreate with subcategory."""
        entry_data = {
            "amount": 50.0,
            "description": "Coffee",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "food",
            "subcategory": "beverages",
        }
        entry = EntryCreate(**entry_data)
        assert entry.subcategory == "beverages"

    def test_entry_create_recurring(self):
        """Test EntryCreate with recurring flag."""
        entry_data = {
            "amount": 1200.0,
            "description": "Monthly rent",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "housing",
            "is_recurring": True,
        }
        entry = EntryCreate(**entry_data)
        assert entry.is_recurring is True


class TestEntryUpdate:
    """Test cases for EntryUpdate schema."""

    def test_entry_update_partial_amount(self):
        """Test EntryUpdate with only amount."""
        update_data = {"amount": 150.0}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.amount == 150.0
        assert entry_update.description is None
        assert entry_update.date is None

    def test_entry_update_partial_description(self):
        """Test EntryUpdate with only description."""
        update_data = {"description": "Updated description"}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.description == "Updated description"
        assert entry_update.amount is None

    def test_entry_update_all_fields(self):
        """Test EntryUpdate with all fields."""
        new_date = datetime.now(timezone.utc)
        update_data = {
            "amount": 200.0,
            "description": "Updated entry",
            "date": new_date,
            "category": "updated_category",
            "subcategory": "updated_sub",
            "is_recurring": True,
        }
        entry_update = EntryUpdate(**update_data)
        assert entry_update.amount == 200.0
        assert entry_update.description == "Updated entry"
        assert entry_update.date == new_date
        assert entry_update.category == "updated_category"
        assert entry_update.subcategory == "updated_sub"
        assert entry_update.is_recurring is True

    def test_entry_update_empty(self):
        """Test EntryUpdate with no fields."""
        entry_update = EntryUpdate()
        assert entry_update.amount is None
        assert entry_update.description is None
        assert entry_update.date is None
        assert entry_update.category is None
        assert entry_update.subcategory is None
        assert entry_update.is_recurring is None

    def test_entry_update_amount_validation_positive(self):
        """Test EntryUpdate amount validation with positive value."""
        update_data = {"amount": 75.0}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.amount == 75.0

    def test_entry_update_amount_validation_zero_invalid(self):
        """Test EntryUpdate amount validation with zero (invalid)."""
        update_data = {"amount": 0.0}
        with pytest.raises(ValidationError) as exc_info:
            EntryUpdate(**update_data)

        errors = exc_info.value.errors()
        assert any("maior que zero" in str(error) for error in errors)

    def test_entry_update_amount_validation_negative_invalid(self):
        """Test EntryUpdate amount validation with negative value."""
        update_data = {"amount": -25.0}
        with pytest.raises(ValidationError) as exc_info:
            EntryUpdate(**update_data)

        errors = exc_info.value.errors()
        assert any("maior que zero" in str(error) for error in errors)

    def test_entry_update_amount_none_allowed(self):
        """Test EntryUpdate with amount as None (should be allowed)."""
        update_data = {"amount": None, "description": "Updated description"}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.amount is None
        assert entry_update.description == "Updated description"

    def test_entry_update_explicit_none_values(self):
        """Test EntryUpdate with explicitly None values."""
        update_data = {
            "amount": None,
            "description": None,
            "date": None,
            "category": None,
            "subcategory": None,
            "is_recurring": None,
        }
        entry_update = EntryUpdate(**update_data)
        assert all(getattr(entry_update, field) is None for field in update_data)

    def test_entry_update_boolean_fields(self):
        """Test EntryUpdate with boolean fields."""
        update_data = {"is_recurring": False}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.is_recurring is False

        update_data = {"is_recurring": True}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.is_recurring is True


class TestEntryInDB:
    """Test cases for EntryInDB schema."""

    def test_entry_in_db_valid_complete(self):
        """Test EntryInDB with all fields."""
        now = datetime.now(timezone.utc)
        entry_data = {
            "id": "entry-123",
            "amount": 100.0,
            "description": "Database entry",
            "date": now,
            "type": "EXPENSE",
            "category": "test",
            "subcategory": "sub",
            "is_recurring": True,
            "created_at": now,
            "updated_at": now,
            "user_id": "user-123",
        }
        entry = EntryInDB(**entry_data)
        assert entry.id == "entry-123"
        assert entry.amount == 100.0
        assert entry.description == "Database entry"
        assert entry.user_id == "user-123"
        assert entry.created_at == now
        assert entry.updated_at == now

    def test_entry_in_db_minimal_required(self):
        """Test EntryInDB with minimal required fields."""
        now = datetime.now(timezone.utc)
        entry_data = {
            "id": "entry-123",
            "amount": 100.0,
            "description": "Minimal entry",
            "date": now,
            "type": "INCOME",
            "category": "test",
            "created_at": now,
            "user_id": "user-123",
        }
        entry = EntryInDB(**entry_data)
        assert entry.id == "entry-123"
        assert entry.user_id == "user-123"
        assert entry.created_at == now
        assert entry.updated_at is None

    def test_entry_in_db_inherits_from_entry_base(self):
        """Test that EntryInDB inherits from EntryBase."""
        assert issubclass(EntryInDB, EntryBase)

    def test_entry_in_db_missing_id(self):
        """Test EntryInDB with missing id."""
        now = datetime.now(timezone.utc)
        entry_data = {
            "amount": 100.0,
            "description": "Missing ID",
            "date": now,
            "type": "EXPENSE",
            "category": "test",
            "created_at": now,
            "user_id": "user-123",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryInDB(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("id",) for error in errors)

    def test_entry_in_db_missing_created_at(self):
        """Test EntryInDB with missing created_at."""
        now = datetime.now(timezone.utc)
        entry_data = {
            "id": "entry-123",
            "amount": 100.0,
            "description": "Missing created_at",
            "date": now,
            "type": "EXPENSE",
            "category": "test",
            "user_id": "user-123",
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryInDB(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("created_at",) for error in errors)

    def test_entry_in_db_missing_user_id(self):
        """Test EntryInDB with missing user_id."""
        now = datetime.now(timezone.utc)
        entry_data = {
            "id": "entry-123",
            "amount": 100.0,
            "description": "Missing user_id",
            "date": now,
            "type": "EXPENSE",
            "category": "test",
            "created_at": now,
        }
        with pytest.raises(ValidationError) as exc_info:
            EntryInDB(**entry_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("user_id",) for error in errors)

    def test_entry_in_db_config_from_attributes(self):
        """Test that EntryInDB has from_attributes configuration."""

        # pylint: disable=too-many-instance-attributes,too-few-public-methods
        class MockEntry:
            """Mock class for testing EntryInDB validation."""

            def __init__(self):
                self.id = "entry-123"
                self.amount = 100.0
                self.description = "Mock entry"
                self.date = datetime.now(timezone.utc)
                self.type = "EXPENSE"
                self.category = "test"
                self.subcategory = None
                self.is_recurring = False
                self.created_at = datetime.now(timezone.utc)
                self.updated_at = None
                self.user_id = "user-123"

        mock_entry = MockEntry()
        entry = EntryInDB.model_validate(mock_entry)
        assert entry.id == "entry-123"
        assert entry.amount == 100.0
        assert entry.user_id == "user-123"


class TestEntryResponse:
    """Test cases for EntryResponse schema."""

    def test_entry_response_inherits_from_entry_in_db(self):
        """Test that EntryResponse inherits from EntryInDB."""
        assert issubclass(EntryResponse, EntryInDB)

    def test_entry_response_same_functionality(self):
        """Test that EntryResponse works exactly like EntryInDB."""
        now = datetime.now(timezone.utc)
        entry_data = {
            "id": "entry-123",
            "amount": 100.0,
            "description": "Response entry",
            "date": now,
            "type": "EXPENSE",
            "category": "test",
            "created_at": now,
            "user_id": "user-123",
        }
        entry_response = EntryResponse(**entry_data)
        entry_in_db = EntryInDB(**entry_data)

        assert entry_response.model_dump() == entry_in_db.model_dump()


class TestEntrySummary:
    """Test cases for EntrySummary schema."""

    def test_entry_summary_valid(self):
        """Test EntrySummary with valid data."""
        summary_data = {
            "total_income": 5000.0,
            "total_expense": 3000.0,
            "balance": 2000.0,
            "count_income": 10,
            "count_expense": 15,
            "total_count": 25,
        }
        summary = EntrySummary(**summary_data)
        assert summary.total_income == 5000.0
        assert summary.total_expense == 3000.0
        assert summary.balance == 2000.0
        assert summary.count_income == 10
        assert summary.count_expense == 15
        assert summary.total_count == 25

    def test_entry_summary_zero_values(self):
        """Test EntrySummary with zero values."""
        summary_data = {
            "total_income": 0.0,
            "total_expense": 0.0,
            "balance": 0.0,
            "count_income": 0,
            "count_expense": 0,
            "total_count": 0,
        }
        summary = EntrySummary(**summary_data)
        assert summary.total_income == 0.0
        assert summary.balance == 0.0
        assert summary.count_income == 0

    def test_entry_summary_negative_balance(self):
        """Test EntrySummary with negative balance."""
        summary_data = {
            "total_income": 2000.0,
            "total_expense": 3000.0,
            "balance": -1000.0,
            "count_income": 5,
            "count_expense": 10,
            "total_count": 15,
        }
        summary = EntrySummary(**summary_data)
        assert summary.balance == -1000.0

    def test_entry_summary_missing_fields(self):
        """Test EntrySummary with missing required fields."""
        summary_data = {
            "total_income": 1000.0,
            "total_expense": 500.0,
            # Missing other required fields
        }
        with pytest.raises(ValidationError):
            EntrySummary(**summary_data)

    def test_entry_summary_float_precision(self):
        """Test EntrySummary with high precision floats."""
        summary_data = {
            "total_income": 1234.567,
            "total_expense": 987.654,
            "balance": 246.913,
            "count_income": 10,
            "count_expense": 15,
            "total_count": 25,
        }
        summary = EntrySummary(**summary_data)
        assert summary.total_income == 1234.567
        assert summary.total_expense == 987.654
        assert summary.balance == 246.913


class TestCategoryDistribution:
    """Test cases for CategoryDistribution schema."""

    def test_category_distribution_valid(self):
        """Test CategoryDistribution with valid data."""
        dist_data = {
            "category": "food",
            "category": "Food & Dining",
            "amount": 1500.0,
            "count": 25,
            "percentage": 35.5,
        }
        distribution = CategoryDistribution(**dist_data)
        assert distribution.category == "food"
        assert distribution.category == "Food & Dining"
        assert distribution.amount == 1500.0
        assert distribution.count == 25
        assert distribution.percentage == 35.5

    def test_category_distribution_zero_values(self):
        """Test CategoryDistribution with zero values."""
        dist_data = {
            "category": "empty",
            "category": "Empty Category",
            "amount": 0.0,
            "count": 0,
            "percentage": 0.0,
        }
        distribution = CategoryDistribution(**dist_data)
        assert distribution.amount == 0.0
        assert distribution.count == 0
        assert distribution.percentage == 0.0

    def test_category_distribution_high_precision(self):
        """Test CategoryDistribution with high precision values."""
        dist_data = {
            "category": "precise",
            "category": "Precise Category",
            "amount": 123.456789,
            "count": 100,
            "percentage": 12.3456,
        }
        distribution = CategoryDistribution(**dist_data)
        assert distribution.amount == 123.456789
        assert distribution.percentage == 12.3456

    def test_category_distribution_missing_fields(self):
        """Test CategoryDistribution with missing required fields."""
        dist_data = {
            "category": "incomplete",
            "amount": 100.0,
            # Missing required fields
        }
        with pytest.raises(ValidationError):
            CategoryDistribution(**dist_data)

    def test_category_distribution_large_values(self):
        """Test CategoryDistribution with large values."""
        dist_data = {
            "category": "large",
            "category": "Large Category",
            "amount": 999999.99,
            "count": 10000,
            "percentage": 100.0,
        }
        distribution = CategoryDistribution(**dist_data)
        assert distribution.amount == 999999.99
        assert distribution.count == 10000
        assert distribution.percentage == 100.0


class TestCategoryDistributionList:
    """Test cases for CategoryDistributionList schema."""

    def test_category_distribution_list_valid(self):
        """Test CategoryDistributionList with valid data."""
        distributions = [
            {
                "category": "food",
                "category": "Food",
                "amount": 1000.0,
                "count": 20,
                "percentage": 50.0,
            },
            {
                "category": "transport",
                "category": "Transport",
                "amount": 500.0,
                "count": 10,
                "percentage": 25.0,
            },
        ]
        list_data = {"distributions": distributions, "total": 2000.0}
        dist_list = CategoryDistributionList(**list_data)
        assert len(dist_list.distributions) == 2
        assert dist_list.total == 2000.0
        assert dist_list.distributions[0].category == "food"
        assert dist_list.distributions[1].category == "transport"

    def test_category_distribution_list_empty(self):
        """Test CategoryDistributionList with empty distributions."""
        list_data = {"distributions": [], "total": 0.0}
        dist_list = CategoryDistributionList(**list_data)
        assert len(dist_list.distributions) == 0
        assert dist_list.total == 0.0

    def test_category_distribution_list_single_item(self):
        """Test CategoryDistributionList with single distribution."""
        distributions = [
            {
                "category": "single",
                "category": "Single Category",
                "amount": 1000.0,
                "count": 5,
                "percentage": 100.0,
            }
        ]
        list_data = {"distributions": distributions, "total": 1000.0}
        dist_list = CategoryDistributionList(**list_data)
        assert len(dist_list.distributions) == 1
        assert dist_list.total == 1000.0

    def test_category_distribution_list_missing_total(self):
        """Test CategoryDistributionList with missing total."""
        distributions = [
            {
                "category": "test",
                "category": "Test",
                "amount": 100.0,
                "count": 1,
                "percentage": 100.0,
            }
        ]
        list_data = {
            "distributions": distributions
            # Missing total
        }
        with pytest.raises(ValidationError):
            CategoryDistributionList(**list_data)


class TestSchemaIntegration:
    """Integration tests for schema interactions."""

    def test_schema_inheritance_chain(self):
        """Test inheritance relationships between schemas."""
        assert issubclass(EntryCreate, EntryBase)
        assert issubclass(EntryInDB, EntryBase)
        assert issubclass(EntryResponse, EntryInDB)
        # EntryUpdate herda de BaseModel, não de EntryBase
        # (por design para Optional fields)
        assert issubclass(EntryUpdate, BaseModel)

    def test_entry_lifecycle_schemas(self):
        """Test schemas work together in entry lifecycle."""
        # Create
        create_data = {
            "amount": 100.0,
            "description": "Test entry",
            "date": datetime.now(timezone.utc),
            "type": "EXPENSE",
            "category": "test",
        }
        entry_create = EntryCreate(**create_data)
        assert entry_create.amount == 100.0

        # Simulate database storage
        now = datetime.now(timezone.utc)
        db_data = {
            **create_data,
            "id": "entry-123",
            "created_at": now,
            "user_id": "user-123",
        }
        entry_in_db = EntryInDB(**db_data)
        assert entry_in_db.id == "entry-123"

        # Response
        entry_response = EntryResponse(**db_data)
        assert entry_response.model_dump() == entry_in_db.model_dump()

        # Update
        update_data = {"amount": 150.0, "description": "Updated entry"}
        entry_update = EntryUpdate(**update_data)
        assert entry_update.amount == 150.0

    def test_summary_calculation_from_entries(self):
        """Test EntrySummary calculation from multiple entries."""
        entries_data = [
            {
                "amount": 1000.0,
                "description": "Income 1",
                "date": datetime.now(timezone.utc),
                "type": "INCOME",
                "category": "salary",
            },
            {
                "amount": 4000.0,
                "description": "Income 2",
                "date": datetime.now(timezone.utc),
                "type": "INCOME",
                "category": "freelance",
            },
            {
                "amount": 200.0,
                "description": "Expense 1",
                "date": datetime.now(timezone.utc),
                "type": "EXPENSE",
                "category": "food",
            },
            {
                "amount": 300.0,
                "description": "Expense 2",
                "date": datetime.now(timezone.utc),
                "type": "EXPENSE",
                "category": "transport",
            },
            {
                "amount": 500.0,
                "description": "Expense 3",
                "date": datetime.now(timezone.utc),
                "type": "EXPENSE",
                "category": "utilities",
            },
        ]

        # Calculate summary
        total_income = sum(e["amount"] for e in entries_data if e["type"] == "INCOME")
        total_expense = sum(e["amount"] for e in entries_data if e["type"] == "EXPENSE")
        balance = total_income - total_expense
        count_income = sum(1 for e in entries_data if e["type"] == "INCOME")
        count_expense = sum(1 for e in entries_data if e["type"] == "EXPENSE")
        total_count = len(entries_data)

        summary_data = {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance,
            "count_income": count_income,
            "count_expense": count_expense,
            "total_count": total_count,
        }
        summary = EntrySummary(**summary_data)

        assert summary.total_income == 5000.0
        assert summary.total_expense == 1000.0
        assert summary.balance == 4000.0
        assert summary.count_income == 2
        assert summary.count_expense == 3
        assert summary.total_count == 5
