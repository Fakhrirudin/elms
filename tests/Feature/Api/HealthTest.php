<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_is_reachable_under_api_v1_prefix()
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
    }

    public function test_health_endpoint_returns_the_standard_api_envelope()
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertJson([
            'success' => true,
            'message' => 'API is healthy',
            'data' => [
                'status' => 'ok',
            ],
        ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => ['status', 'timestamp'],
        ]);
    }

    public function test_health_endpoint_does_not_require_authentication()
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertJsonMissingPath('errors');
    }

    public function test_health_endpoint_is_registered_as_a_json_response_for_unknown_api_routes()
    {
        $response = $this->getJson('/api/v1/this-route-does-not-exist');

        $response->assertStatus(404);
        $response->assertHeader('content-type', 'application/json');
    }
}
