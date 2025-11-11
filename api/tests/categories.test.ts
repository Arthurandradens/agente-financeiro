import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

describe("Categories endpoints", () => {
  let app: any;

  beforeEach(async () => {
    app = await createApp();
  });

  it("should list categories", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/categories",
      headers: {
        "x-api-key": "changeme",
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should return category hierarchy", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/categories/hierarchy",
      headers: {
        "x-api-key": "changeme",
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create category", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/categories",
      headers: {
        "x-api-key": "changeme",
        "content-type": "application/json",
      },
      payload: {
        name: "Test Category",
        slug: "test-category",
        kind: "spend",
      },
    });

    expect(response.statusCode).toBe(201);
    const result = JSON.parse(response.body);

    expect(result.name).toBe("Test Category");
    expect(result.slug).toBe("test-category");
    expect(result.kind).toBe("spend");
  });

  it("should not create category with duplicate slug", async () => {
    // Criar primeira categoria
    await app.inject({
      method: "POST",
      url: "/categories",
      headers: {
        "x-api-key": "changeme",
        "content-type": "application/json",
      },
      payload: {
        name: "Test Category",
        slug: "test-category",
        kind: "spend",
      },
    });

    // Tentar criar segunda categoria com mesmo slug
    const response = await app.inject({
      method: "POST",
      url: "/categories",
      headers: {
        "x-api-key": "changeme",
        "content-type": "application/json",
      },
      payload: {
        name: "Another Category",
        slug: "test-category",
        kind: "income",
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it("should update category", async () => {
    // Criar categoria
    const createResponse = await app.inject({
      method: "POST",
      url: "/categories",
      headers: {
        "x-api-key": "changeme",
        "content-type": "application/json",
      },
      payload: {
        name: "Test Category",
        slug: "test-category",
        kind: "spend",
      },
    });

    const created = JSON.parse(createResponse.body);

    // Atualizar categoria
    const response = await app.inject({
      method: "PATCH",
      url: `/categories/${created.id}`,
      headers: {
        "x-api-key": "changeme",
        "content-type": "application/json",
      },
      payload: {
        name: "Updated Category",
        kind: "income",
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    expect(result.name).toBe("Updated Category");
    expect(result.kind).toBe("income");
    expect(result.slug).toBe("test-category"); // Não mudou
  });

  it("should delete category", async () => {
    // Criar categoria
    const createResponse = await app.inject({
      method: "POST",
      url: "/categories",
      headers: {
        "x-api-key": "changeme",
        "content-type": "application/json",
      },
      payload: {
        name: "Test Category",
        slug: "test-category",
        kind: "spend",
      },
    });

    const created = JSON.parse(createResponse.body);

    // Excluir categoria
    const response = await app.inject({
      method: "DELETE",
      url: `/categories/${created.id}`,
      headers: {
        "x-api-key": "changeme",
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    expect(result.success).toBe(true);
  });
});
