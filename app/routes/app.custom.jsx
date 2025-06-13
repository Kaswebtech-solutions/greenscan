import { useEffect, useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Badge,
  LegacyCard,
  LegacyStack,
  RadioButton,
  Select,
  TextField,
  Button,
  Text,
  ButtonGroup
} from "@shopify/polaris";

export default function AdditionalPage() {
  const [selectedType, setSelectedType] = useState("product");
  const [productOptions, setProductOptions] = useState([{ label: "Please choose a product", value: "", disabled: true }]);
  const [collectionOptions, setCollectionOptions] = useState([{ label: "Please choose a collection", value: "", disabled: true }]);
  const [pageOptions, setPageOptions] = useState([{ label: "Please choose a page", value: "", disabled: true }]);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [customText, setCustomText] = useState("");
  const [editableText, setEditableText] = useState("");
  const [complianceResult, setComplianceResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [planName, setPlanName] = useState(null); // NEW: Store plan name

  const fetcher = useFetcher();

  // Fetch plan on mount
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/store-plan");
        const data = await res.json();
        setPlanName(data.planName);
      } catch (err) {
        console.error("Failed to fetch plan:", err);
      }
    };
    fetchPlan();
  }, []);
  

  const handleRadioChange = (value) => {
    setSelectedType(value);
    setComplianceResult(null);
    setEditableText("");
  };

  const handleProductChange = useCallback((value) => {
    setSelectedProduct(value);
    setComplianceResult(null);
  }, []);

  const handleCollectionChange = useCallback((value) => {
    setSelectedCollection(value);
    setComplianceResult(null);
  }, []);

  const handlePageChange = useCallback((value) => {
    setSelectedPage(value);
    setComplianceResult(null);
  }, []);

  const handleCustomTextChange = useCallback((newValue) => {
    setCustomText(newValue);
    setEditableText(newValue);
    setComplianceResult(null);
  }, []);

  const stripHtml = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const extractShopifyId = (gid) => gid.split("/").pop();

  const getCurrentText = () => {
    if (selectedType === "custom-text") return customText;
    if (selectedType === "product" && fetcher.data?.product?.description) return fetcher.data.product.description;
    if (selectedType === "collection" && fetcher.data?.collection?.description) return fetcher.data.collection.description;
    if (selectedType === "page" && fetcher.data?.page?.body) return stripHtml(fetcher.data.page.body);
    return "";
  };

  useEffect(() => {
    if (selectedType === "product" && selectedProduct) {
      fetcher.load(`/products/${extractShopifyId(selectedProduct)}`);
    } else if (selectedType === "collection" && selectedCollection) {
      fetcher.load(`/collections/${extractShopifyId(selectedCollection)}`);
    } else if (selectedType === "page" && selectedPage) {
      fetcher.load(`/pages/${extractShopifyId(selectedPage)}`);
    }
  }, [selectedProduct, selectedCollection, selectedPage]);

  useEffect(() => {
    if (selectedType === "product") {
      fetcher.load("/api/products");
    } else if (selectedType === "collection") {
      fetcher.load("/api/collections");
    } else if (selectedType === "page") {
      fetcher.load("/api/pages");
    }
  }, [selectedType]);

  useEffect(() => {
    if (fetcher.data?.products) {
      setProductOptions([{ label: "Please choose a product", value: "", disabled: true }, ...fetcher.data.products]);
    } else if (fetcher.data?.collections) {
      setCollectionOptions([{ label: "Please choose a collection", value: "", disabled: true }, ...fetcher.data.collections]);
    } else if (fetcher.data?.pages) {
      setPageOptions([{ label: "Please choose a page", value: "", disabled: true }, ...fetcher.data.pages]);
    }
  }, [fetcher.data]);

  useEffect(() => {
    setEditableText(getCurrentText());
  }, [selectedProduct, selectedCollection, selectedPage, selectedType, fetcher.data]);

  const handleCheckViolation = async () => {
    if(selectedType === "page" || selectedType === "product" || selectedType === "collection"){       
      if (planName === "basic") {
        alert("This feature is not available on the Basic plan.");
        return;
      }
    } 
  
    const content = editableText;
    setIsChecking(true);
  
    try {
      const response = await fetch("/api/check-compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
  
      const result = await response.json();
      setComplianceResult(result);
    } catch (err) {
      console.error("Error checking compliance:", err);
      setComplianceResult({ error: "Failed to check compliance" });
    } finally {
      setIsChecking(false);
    }
  };
  

  const handleUpdateContent = async () => {
    setIsUpdating(true);
    const id =
      selectedType === "product"
        ? extractShopifyId(selectedProduct)
        : selectedType === "collection"
        ? extractShopifyId(selectedCollection)
        : selectedType === "page"
        ? extractShopifyId(selectedPage)
        : null;

    const endpoint =
      selectedType === "product"
        ? `/products/${id}/update-description`
        : selectedType === "collection"
        ? `/collections/${id}/update-description`
        : selectedType === "page"
        ? `/pages/${id}/update-description`
        : null;

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editableText }),
      });

      if (!res.ok) throw new Error("Update failed");

      const data = await res.json();
      alert("Content updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update content.");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderHighlightedText = (text, issues) => {
    if (!issues?.length) return <Text>{text}</Text>;

    let lastIndex = 0;
    const parts = [];

    for (const issue of issues) {
      const index = text.indexOf(issue.problematic_text, lastIndex);
      if (index === -1) continue;

      parts.push(text.slice(lastIndex, index));
      parts.push(
        <span key={index} style={{ textDecoration: "underline wavy red" }}>
          {issue.problematic_text}
        </span>
      );
      lastIndex = index + issue.problematic_text.length;
    }

    parts.push(text.slice(lastIndex));
    return <Text as="p">{parts}</Text>;
  };

  const isBasicPlan = planName === "basic";
  const disableAdvancedFeatures = isBasicPlan;

  const isstarterPlan = planName === "starter";
  const disableUpdateFeatures = isstarterPlan;

  return (
    <Page titleMetadata={<Badge tone="success">{planName ? planName.toUpperCase() : "Loading..."}</Badge>}>
      <LegacyCard title="Green Scanner" sectioned>
        <LegacyStack vertical>
          <LegacyStack horizontal>
            <RadioButton label="Product" id="product" name="type" checked={selectedType === "product"} onChange={() => handleRadioChange("product")} disabled={disableAdvancedFeatures} />
            <RadioButton label="Collection" id="collection" name="type" checked={selectedType === "collection"} onChange={() => handleRadioChange("collection")} disabled={disableAdvancedFeatures} />
            <RadioButton label="Page" id="page" name="type" checked={selectedType === "page"} onChange={() => handleRadioChange("page")} disabled={disableAdvancedFeatures} />
            <RadioButton label="Custom Text" id="custom-text" name="type" checked={selectedType === "custom-text"} onChange={() => handleRadioChange("custom-text")} />
          </LegacyStack>

          {selectedType === "product" && (
            <Select label="Select a Product" options={productOptions} onChange={handleProductChange} value={selectedProduct} disabled={disableAdvancedFeatures} />
          )}
          {selectedType === "collection" && (
            <Select label="Select a Collection" options={collectionOptions} onChange={handleCollectionChange} value={selectedCollection} disabled={disableAdvancedFeatures} />
          )}
          {selectedType === "page" && (
            <Select label="Select a Page" options={pageOptions} onChange={handlePageChange} value={selectedPage} disabled={disableAdvancedFeatures} />
          )}

          <LegacyStack vertical spacing="tight">
            <TextField
              label="Text to Check"
              value={editableText}
              multiline={4}
              autoComplete="off"
              onChange={(val) => {
                setEditableText(val);
                setComplianceResult(null);
              }}
              disabled={disableAdvancedFeatures && (selectedType === "product" || selectedType === "collection" || selectedType === "page")}

            />

            <ButtonGroup>
              <Button variant="primary" onClick={handleCheckViolation} loading={isChecking} disabled={disableAdvancedFeatures && (selectedType === "product" || selectedType === "collection" || selectedType === "page")}>
                Scan Content
              </Button>
              {(selectedType === "page" || selectedType === "product" || selectedType === "collection") && (
                <Button
                  variant="primary"
                  onClick={handleUpdateContent}
                  loading={isUpdating}
                  disabled={disableAdvancedFeatures || disableUpdateFeatures}
                >
                  Update Content
                </Button>
              )}

            </ButtonGroup>
          </LegacyStack>

          {complianceResult && (
            <div style={{ marginTop: '1rem' }}>
              {complianceResult?.error && (
                <Text>
                  {complianceResult.error}
                </Text>
              )}


              <Text as="h4" variant="headingSm">
                Status:{" "}
                <Badge tone={complianceResult.compliance_status === "Compliant" ? "success" : "critical"}>
                  {complianceResult.compliance_status}
                </Badge>
              </Text>
             
              {renderHighlightedText(editableText, complianceResult.issues || [])}

              {complianceResult.compliance_status === "Non-Compliant" && complianceResult.issues?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <Text as="h4" variant="headingSm">Suggestions</Text>
                  <ul>
                    {complianceResult.issues.map((issue, index) => (
                      <li key={index} style={{ marginBottom: "0.75rem" }}>
                        <Text as="span"><strong>Problematic Text:</strong> {issue.problematic_text}</Text><br />
                        <Text as="span"><strong>Reason:</strong> {issue.reason}</Text><br />
                        <Text as="span"><strong>Suggested Fix:</strong> {issue.suggested_fix}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </LegacyStack>
      </LegacyCard>
    </Page>
  );
}
