"""Reusable pagination classes for the REST API."""
from __future__ import annotations

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default paginator: page-number based with a stable envelope shape.

    Response shape::

        {
            "count": 123,
            "next": "http://.../api/.../?page=3",
            "previous": "http://.../api/.../?page=1",
            "page_size": 20,
            "results": [...]
        }
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        response.data["page_size"] = self.get_page_size(self.request)
        return response


class PassthroughPagination(PageNumberPagination):
    """Paginator that returns all results on page 1 by using a very high
    page size. Keeps the standard envelope shape (count, next, previous,
    results) for frontends that expect it.
    """

    page_size = 10000
    page_size_query_param = "page_size"
    max_page_size = 10000

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        response.data["page_size"] = self.get_page_size(self.request)
        return response
