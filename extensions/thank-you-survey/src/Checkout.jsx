import { render } from "preact";
import { useState } from "preact/hooks";

export default async function () {
  render(<Extension />, document.body);
}

function Extension() {
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selected) return;

    try {
      setLoading(true);

      const orderId =
      shopify?.orderConfirmation?.current?.order?.id || "";
    
    const customerEmail =
      shopify?.buyerIdentity?.email?.current || "";
    
    const customerName =
      shopify?.shippingAddress?.current?.name || "";
    
    const shop =
      shopify?.shop?.myshopifyDomain || "";

      console.log({
        orderId,
        customerEmail,
        customerName,
        shop,
      });

      await fetch(
        "https://health-mysql-villages-compromise.trycloudflare.com/api/survey",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: selected,
            orderId,
            customerEmail,
            customerName,
            shop,
          }),
        }
      );

      setSubmitted(true);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <s-box
        border="base"
        padding="base"
        border-radius="base"
      >
        <s-stack gap="base">

          <s-heading>
            Thank you for your feedback!
          </s-heading>

          <s-text>
            Your response has been submitted successfully.
          </s-text>

        </s-stack>
      </s-box>
    );
  }

  return (
    <s-box
      border="base"
      padding="base"
      border-radius="base"
    >
      <s-stack gap="base">

        <s-heading>
          How did you hear about us?
        </s-heading>

        <s-choice-list
  name="survey"
  value={selected}
  onChange={(event) => {
    setSelected(
      event.currentTarget.values[0]
    );
  }}
>

  <s-choice value="instagram">
    Instagram
  </s-choice>

  <s-choice value="facebook">
    Facebook
  </s-choice>

  <s-choice value="google">
    Google Search
  </s-choice>

  <s-choice value="youtube">
    YouTube
  </s-choice>

  <s-choice value="reddit">
    Reddit
  </s-choice>

  <s-choice value="ai_recommendation">
    AI Recommendation (ChatGPT)
  </s-choice>

  <s-choice value="tiktok">
    TikTok
  </s-choice>

  <s-choice value="friend_referral">
    Friend / Referral
  </s-choice>

  <s-choice value="retail_store">
    Retail Store
  </s-choice>

  <s-choice value="amazon">
    Amazon
  </s-choice>

</s-choice-list>

        <s-button
          variant="secondary"
          loading={loading}
          onClick={handleSubmit}
        >
          Submit
        </s-button>

      </s-stack>
    </s-box>
  );
}