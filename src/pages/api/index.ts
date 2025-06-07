import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    return new Response(
      JSON.stringify({
        message: "sdada",
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
}
