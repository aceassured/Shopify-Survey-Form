import prisma from "../db.server";

export async function loader() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function action({ request }) {
  try {
    const body = await request.json();

    console.log("BODY:", body);

    const response = await prisma.surveyResponse.create({
      data: {
        source: body.source,
        orderId: body.orderId,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        shop: body.shop,
      },
    });

    console.log("SAVED:", response);

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("API ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}