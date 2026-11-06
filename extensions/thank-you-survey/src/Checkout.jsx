import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useRef, useState } from "preact/hooks";

export default async function () {
  render(<Extension />, document.body);
}

function Extension() {
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function handleSubmit() {
    if (submitting.current) return;
    if (!selected) {
      setError("Please select an option before submitting.");
      return;
    }

    submitting.current = true;
    setError("");

    try {
      setLoading(true);

      const orderId =
      shopify.orderConfirmation.value?.order?.id || "";
    
    const customerEmail =
      shopify.buyerIdentity?.email?.value || "";
    
    const customerName =
      shopify.shippingAddress?.value?.name || "";
    
    const shop =
      shopify?.shop?.myshopifyDomain || "";

      const response = await fetch(
        "https://shopify-survey-form-vjh2.onrender.com/api/survey",
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

      if (!response.ok) throw new Error("Survey request failed");
      const result = await response.json();
      if (result.success !== true) throw new Error("Survey was not saved");

      setSubmitted(true);

    } catch (error) {
      console.error("Survey submission failed", error);
      setError("We couldn't save your response. Please try submitting again.");

    } finally {
      setLoading(false);
      submitting.current = false;
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
  values={selected ? [selected] : []}
  disabled={loading}
  onChange={(event) => {
    const choiceList = /** @type {EventTarget & { values: string[] }} */ (event.currentTarget);
    setSelected(
      choiceList.values[0] || ""
    );
    setError("");
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

        {error && <s-banner tone="critical">{error}</s-banner>}

        <s-button
          variant="secondary"
          loading={loading}
          disabled={loading}
          onClick={handleSubmit}
        >
          Submit
        </s-button>

      </s-stack>
    </s-box>
  );
}
