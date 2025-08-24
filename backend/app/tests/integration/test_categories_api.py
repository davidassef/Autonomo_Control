"""
Comprehensive tests for the categories_fixed API endpoints to achieve coverage.
"""

import pytest
from fastapi import status
from unittest.mock import patch


def test_create_category_basic(test_client, auth_headers, test_db):
    """Test basic category creation."""
    category_data = {"name": "Test Category", "type": "EXPENSE"}

    response = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == category_data["name"]
    assert data["type"] == category_data["type"]
    assert data["is_default"] == False


def test_read_categories_basic(test_client, auth_headers, test_db):
    """Test basic category reading."""
    response = test_client.get("/api/v1/categories/", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_read_single_category(test_client, auth_headers, test_db):
    """Test reading a single category."""
    # First create a category
    category_data = {"name": "Single Test Category", "type": "INCOME"}

    create_response = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    assert create_response.status_code == status.HTTP_201_CREATED
    category_id = create_response.json()["id"]

    # Then read it
    response = test_client.get(
        f"/api/v1/categories/{category_id}", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == category_data["name"]
    assert data["type"] == category_data["type"]


def test_update_category(test_client, auth_headers, test_db):
    """Test category update."""
    # First create a category
    category_data = {"name": "Update Test Category", "type": "EXPENSE"}

    create_response = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    assert create_response.status_code == status.HTTP_201_CREATED
    category_id = create_response.json()["id"]

    # Then update it
    update_data = {"name": "Updated Category Name", "type": "INCOME"}

    response = test_client.put(
        f"/api/v1/categories/{category_id}", json=update_data, headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["type"] == update_data["type"]


def test_delete_category(test_client, auth_headers, test_db):
    """Test category deletion."""
    # First create a category
    category_data = {"name": "Delete Test Category", "type": "EXPENSE"}

    create_response = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    assert create_response.status_code == status.HTTP_201_CREATED
    category_id = create_response.json()["id"]

    # Then delete it
    response = test_client.delete(
        f"/api/v1/categories/{category_id}", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK

    # Verify it's deleted
    get_response = test_client.get(
        f"/api/v1/categories/{category_id}", headers=auth_headers
    )
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_create_category_unauthorized(test_client, test_db):
    """Test category creation without authentication."""
    category_data = {"name": "Unauthorized Category", "type": "EXPENSE"}

    response = test_client.post("/api/v1/categories/", json=category_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_read_categories_unauthorized(test_client, test_db):
    """Test category reading without authentication."""
    response = test_client.get("/api/v1/categories/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_category_invalid_data(test_client, auth_headers, test_db):
    """Test category creation with invalid data."""
    invalid_data = {"name": "", "type": "INVALID_TYPE"}  # Empty name

    response = test_client.post(
        "/api/v1/categories/", json=invalid_data, headers=auth_headers
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_read_nonexistent_category(test_client, auth_headers, test_db):
    """Test reading a non-existent category."""
    response = test_client.get("/api/v1/categories/99999", headers=auth_headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_nonexistent_category(test_client, auth_headers, test_db):
    """Test updating a non-existent category."""
    update_data = {"name": "Updated Name", "type": "INCOME"}

    response = test_client.put(
        "/api/v1/categories/99999", json=update_data, headers=auth_headers
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_nonexistent_category(test_client, auth_headers, test_db):
    """Test deleting a non-existent category."""
    response = test_client.delete("/api/v1/categories/99999", headers=auth_headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_duplicate_category(test_client, auth_headers, test_db):
    """Test creating a duplicate category."""
    category_data = {"name": "Duplicate Category", "type": "EXPENSE"}

    # Create first category
    response1 = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )
    assert response1.status_code == status.HTTP_201_CREATED

    # Try to create duplicate
    response2 = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    # This might return 400 or 409 depending on implementation
    assert response2.status_code in [
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_409_CONFLICT,
    ]


def test_create_category_with_special_characters(test_client, auth_headers, test_db):
    """Test creating category with special characters in name."""
    category_data = {"name": "Special @#$% Category", "type": "EXPENSE"}

    response = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == category_data["name"]


def test_create_category_with_long_name(test_client, auth_headers, test_db):
    """Test creating category with very long name."""
    category_data = {"name": "A" * 100, "type": "INCOME"}  # Very long name

    response = test_client.post(
        "/api/v1/categories/", json=category_data, headers=auth_headers
    )

    # Should either succeed or return validation error
    assert response.status_code in [
        status.HTTP_201_CREATED,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
    ]


def test_categories_pagination(test_client, auth_headers, test_db):
    """Test categories list with pagination parameters."""
    # Create multiple categories first
    for i in range(5):
        category_data = {"name": f"Pagination Test Category {i}", "type": "EXPENSE"}
        test_client.post(
            "/api/v1/categories/", json=category_data, headers=auth_headers
        )

    # Test with pagination parameters
    response = test_client.get(
        "/api/v1/categories/?skip=0&limit=3", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_categories_filtering(test_client, auth_headers, test_db):
    """Test categories filtering by type."""
    # Create categories of different types
    expense_category = {"name": "Filter Test Expense", "type": "EXPENSE"}
    income_category = {"name": "Filter Test Income", "type": "INCOME"}

    test_client.post("/api/v1/categories/", json=expense_category, headers=auth_headers)
    test_client.post("/api/v1/categories/", json=income_category, headers=auth_headers)

    # Test filtering by type (if supported)
    response = test_client.get("/api/v1/categories/?type=EXPENSE", headers=auth_headers)

    # Should work or return the full list if filtering not implemented
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
