// lib/client/vatmiraal-client.ts
import { safePromise, error, isError } from "result-interface";

// lib/common/to-error.ts
function toError(value) {
  return value instanceof Error ? value : new Error(String(value));
}

// lib/client/vatmiraal-client.ts
var DEFAULT_BASE_URL = "https://api.vatmiraal.be";
var VatmiraalClient = class {
  constructor(options) {
    this.options = options;
  }
  options;
  /** Base URL requests are made relative to, with the default applied. */
  get baseUrl() {
    return this.options.baseUrl ?? DEFAULT_BASE_URL;
  }
  async request(path, init) {
    const sent = await safePromise(
      globalThis.fetch(`${this.baseUrl}${path}`, this.applyAuth(init))
    );
    return isError(sent) ? error(toError(sent.error)) : sent;
  }
  applyAuth(init) {
    const headers = new Headers(init?.headers);
    if (this.options.token) {
      headers.set("Authorization", `Bearer ${this.options.token}`);
    }
    const next = { ...init, headers };
    if (this.options.credentials) {
      next.credentials = this.options.credentials;
    }
    return next;
  }
};

// lib/client/api-error.ts
import { safePromise as safePromise2, isError as isError2 } from "result-interface";
function isApiErrorBody(value) {
  return typeof value === "object" && value !== null && typeof value.type === "string" && typeof value.message === "string";
}
var ApiError = class extends Error {
  constructor(status, type, message, extra) {
    super(message);
    this.status = status;
    this.type = type;
    this.extra = extra;
    this.name = "ApiError";
  }
  status;
  type;
  extra;
};
async function apiErrorFromResponse(response, path) {
  const body = await safePromise2(response.json());
  if (!isError2(body) && isApiErrorBody(body.value)) {
    return new ApiError(response.status, body.value.type, body.value.message, body.value.extra);
  }
  return new Error(`${path} returned ${response.status}`);
}

// lib/client/stream.ts
import { result, error as error2, isError as isError3 } from "result-interface";
async function streamLines(client, path, init) {
  const res = await client.request(path, init);
  if (isError3(res)) {
    return res;
  }
  if (!res.value.ok) {
    return error2(await apiErrorFromResponse(res.value, path));
  }
  const body = res.value.body;
  if (body === null) {
    return error2(new Error(`${path} returned no body`));
  }
  return result(readLines(body));
}
async function* readLines(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (; ; ) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line !== "") {
          yield line;
        }
        newline = buffer.indexOf("\n");
      }
    }
    buffer += decoder.decode();
    const last = buffer.trim();
    if (last !== "") {
      yield last;
    }
  } finally {
    await reader.cancel().catch(() => {
    });
  }
}

// lib/client/health.ts
import { result as result3, isError as isError5 } from "result-interface";

// lib/client/json.ts
import { result as result2, error as error3, safePromise as safePromise3, isError as isError4 } from "result-interface";
async function requestJson(client, path, guard, init) {
  const res = await client.request(path, init);
  if (isError4(res)) {
    return res;
  }
  if (!res.value.ok) {
    return error3(await apiErrorFromResponse(res.value, path));
  }
  const json = await safePromise3(res.value.json());
  if (isError4(json)) {
    return error3(toError(json.error));
  }
  if (!guard(json.value)) {
    return error3(new Error(`${path} returned an unexpected payload`));
  }
  return result2(json.value);
}

// lib/client/health.ts
function isAlive(value) {
  return typeof value === "object" && value !== null && typeof value.alive === "boolean";
}
async function ping(client) {
  const res = await requestJson(client, "/", isAlive);
  return isError5(res) ? res : result3(res.value.alive);
}

// lib/common/safe/transport.ts
import { error as error4, result as result4 } from "result-interface";

// lib/common/safe/safe.ts
function asSafe(value) {
  return value;
}

// lib/common/safe/check.ts
function mustBeOneOf(value, name, allowed, describe, errors) {
  if (!allowed.includes(value)) {
    errors.push({ path: name, message: `must be ${describe}` });
  }
}
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function mustBeDate(value, name, errors) {
  if (!ISO_DATE.test(value)) {
    errors.push({ path: name, message: "must be a date in YYYY-MM-DD format" });
  }
}
function mustBeNonNegative(value, name, errors) {
  if (!(value >= 0)) {
    errors.push({ path: name, message: "must be a number >= 0" });
  }
}

// lib/common/safe/path.ts
function scoped(path) {
  return (field) => path === "" ? field : `${path}.${field}`;
}

// lib/common/safe/transport.ts
function transport(input, schema) {
  const errors = [];
  validateTransport(input, schema, "", errors);
  return errors.length > 0 ? error4(errors) : result4(asSafe(input));
}
function isSafeTransport(input, schema) {
  const errors = [];
  validateTransport(input, schema, "", errors);
  return errors.length === 0;
}
function validateTransport(input, schema, path, errors) {
  const at = scoped(path);
  mustBeOneOf(input.from, at("from"), schema.countries, "a known country", errors);
  mustBeOneOf(input.to, at("to"), schema.countries, "a known country", errors);
  mustBeOneOf(input.by, at("by"), schema.transportBy, "a known transport method", errors);
}

// lib/common/safe/party.ts
import { error as error5, result as result5 } from "result-interface";

// lib/common/safe/properties.ts
function validateProperties(props, specs, schema, path, errors) {
  for (const [i, prop] of props.entries()) {
    const at = `${path}[${i}]`;
    const spec = specs.find((s) => s.value === prop.type);
    if (spec === void 0) {
      errors.push({ path: `${at}.type`, message: `unknown property '${prop.type}'` });
      continue;
    }
    if (prop.args.length !== spec.args.length) {
      errors.push({
        path: `${at}.args`,
        message: `expected ${spec.args.length} argument(s), got ${prop.args.length}`
      });
      continue;
    }
    for (const [j, argSpec] of spec.args.entries()) {
      validateArg(prop.args[j], argSpec, schema, `${at}.args[${j}]`, errors);
    }
  }
}
function membership(spec, schema) {
  switch (spec.domain) {
    case "oneof":
      return { values: spec.values ?? [], describe: `one of: ${(spec.values ?? []).join(", ")}` };
    case "country":
      return { values: schema.countries, describe: "a known country" };
    default:
      return void 0;
  }
}
function validateArg(value, spec, schema, path, errors) {
  const set = membership(spec, schema);
  if (set !== void 0) {
    if (!(typeof value === "string" && set.values.includes(value))) {
      errors.push({ path, message: `must be ${set.describe}` });
    }
    return;
  }
  switch (spec.domain) {
    case "int":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        errors.push({ path, message: "must be an integer" });
      } else if (spec.min !== void 0 && value < spec.min) {
        errors.push({ path, message: `must be >= ${spec.min}` });
      } else if (spec.max !== void 0 && value > spec.max) {
        errors.push({ path, message: `must be <= ${spec.max}` });
      }
      return;
    case "rate":
      if (!(typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100)) {
        errors.push({ path, message: "must be an integer rate between 0 and 100" });
      }
      return;
    default:
      if (typeof value !== "string") {
        errors.push({ path, message: "must be a string" });
      }
  }
}

// lib/common/safe/party.ts
function party(input, schema) {
  const errors = [];
  validateParty(input, schema, "", errors);
  return errors.length > 0 ? error5(errors) : result5(asSafe(input));
}
function isSafeParty(input, schema) {
  const errors = [];
  validateParty(input, schema, "", errors);
  return errors.length === 0;
}
function validateParty(input, schema, path, errors) {
  const at = scoped(path);
  mustBeOneOf(input.type, at("type"), schema.partyTypes, "a known party type", errors);
  mustBeOneOf(input.country, at("country"), schema.countries, "a known country", errors);
  validateProperties(input.properties, schema.partyProperties, schema, at("properties"), errors);
}

// lib/common/safe/analysis-object.ts
import { error as error6, result as result6 } from "result-interface";
function analysisObject(input, schema) {
  const errors = [];
  validateAnalysisObject(input, schema, "", errors);
  return errors.length > 0 ? error6(errors) : result6(asSafe(input));
}
function isSafeAnalysisObject(input, schema) {
  const errors = [];
  validateAnalysisObject(input, schema, "", errors);
  return errors.length === 0;
}
function validateAnalysisObject(input, schema, path, errors) {
  const at = scoped(path);
  const objectTypes = schema.categories.map((category) => category.value);
  mustBeOneOf(input.type, at("type"), objectTypes, "a known object type", errors);
  validateProperties(input.properties, schema.objectProperties, schema, at("properties"), errors);
  if (input.transport !== void 0) {
    validateTransport(input.transport, schema, at("transport"), errors);
  }
}

// lib/common/safe/transaction.ts
import { error as error7, result as result7 } from "result-interface";
function transaction(input, schema) {
  const errors = [];
  validateTransaction(input, schema, "", errors);
  return errors.length > 0 ? error7(errors) : result7(asSafe(input));
}
function isSafeTransaction(input, schema) {
  const errors = [];
  validateTransaction(input, schema, "", errors);
  return errors.length === 0;
}
function validateTransaction(input, schema, path, errors) {
  const at = scoped(path);
  mustBeDate(input.taxable_point, at("taxable_point"), errors);
  mustBeOneOf(input.type, at("type"), schema.transactionTypes, "a known transaction type", errors);
  mustBeNonNegative(input.taxable_amount, at("taxable_amount"), errors);
  mustBeNonNegative(input.vat_amount, at("vat_amount"), errors);
  validateParty(input.supplier, schema, at("supplier"), errors);
  validateParty(input.receiver, schema, at("receiver"), errors);
  validateAnalysisObject(input.object, schema, at("object"), errors);
}

// lib/common/safe/request.ts
import { error as error8, result as result8 } from "result-interface";
var PERSPECTIVES = ["supplier", "receiver"];
function taxGridAnalysisRequest(input, schema) {
  const errors = [];
  validateTaxGridAnalysisRequest(input, schema, "", errors);
  return errors.length > 0 ? error8(errors) : result8(asSafe(input));
}
function isSafeTaxGridAnalysisRequest(input, schema) {
  const errors = [];
  validateTaxGridAnalysisRequest(input, schema, "", errors);
  return errors.length === 0;
}
function validateTaxGridAnalysisRequest(input, schema, path, errors) {
  const at = scoped(path);
  validateTransaction(input.transaction, schema, at("transaction"), errors);
  mustBeOneOf(
    input.perspective,
    at("perspective"),
    PERSPECTIVES,
    "'supplier' or 'receiver'",
    errors
  );
}

// lib/analysis/tax-grid-output-guards.ts
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function isUnknownArray(value) {
  return Array.isArray(value);
}
function isLegalReference(value) {
  if (!isRecord(value)) {
    return false;
  }
  if (value.no_basis === true) {
    return true;
  }
  if (typeof value.code === "string") {
    return true;
  }
  return typeof value.article === "string" && typeof value.paragraph === "string" && typeof value.section === "string" && typeof value.subsection === "string" && typeof value.book === "string";
}
function isJustificationContext(value) {
  return isRecord(value) && (value.type === "place" || value.type === "debtor" || value.type === "does_not_apply");
}
function isJustification(value) {
  return isRecord(value) && isLegalReference(value.legal_reference) && typeof value.justification === "string" && typeof value.applies === "boolean" && (value.context === void 0 || isJustificationContext(value.context));
}
function isTaxGridResult(value) {
  return isRecord(value) && typeof value.grid === "string" && typeof value.amount === "number" && isUnknownArray(value.justifications) && value.justifications.every(isJustification);
}
function isWarning(value) {
  return isRecord(value) && typeof value.type === "string" && isRecord(value.data) && typeof value.justification === "string";
}
function isTaxGridAnalysisResponse(value) {
  if (!isRecord(value) || !isUnknownArray(value.warnings) || !value.warnings.every(isWarning)) {
    return false;
  }
  if (value.status === "consistent") {
    return isUnknownArray(value.grids) && value.grids.every(isTaxGridResult);
  }
  if (value.status === "inconsistent") {
    return isUnknownArray(value.inconsistencies) && value.inconsistencies.every(isWarning);
  }
  return false;
}

// lib/analysis/analyze.ts
function analyzeTaxGrid(client, request) {
  return requestJson(client, "/tax-grid-analysis", isTaxGridAnalysisResponse, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(request)
  });
}

// lib/schema/schema.ts
import { result as result9, error as error9, safePromise as safePromise4, isError as isError6 } from "result-interface";

// lib/schema/schema-guards.ts
function isRecord2(value) {
  return typeof value === "object" && value !== null;
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
function isBroadCategoryRef(value) {
  return isRecord2(value) && typeof value.value === "string" && typeof value.label === "string";
}
function isObjectCategory(value) {
  return isRecord2(value) && typeof value.value === "string" && typeof value.label === "string" && isBroadCategoryRef(value.broad_category) && isStringArray(value.transaction_types) && typeof value.description === "string" && (value.properties === null || isStringArray(value.properties));
}
function isPropertyArg(value) {
  return isRecord2(value) && typeof value.name === "string" && typeof value.domain === "string" && (value.type_name === void 0 || typeof value.type_name === "string") && (value.values === void 0 || isStringArray(value.values)) && (value.min === void 0 || typeof value.min === "number") && (value.max === void 0 || typeof value.max === "number");
}
function isPropertySpec(value) {
  return isRecord2(value) && typeof value.value === "string" && typeof value.label === "string" && Array.isArray(value.args) && value.args.every(isPropertyArg);
}
function isObjectCategoryArray(value) {
  return Array.isArray(value) && value.every(isObjectCategory);
}
function isBroadCategoryRefArray(value) {
  return Array.isArray(value) && value.every(isBroadCategoryRef);
}
function isBroadCategoryDetail(value) {
  return isRecord2(value) && typeof value.value === "string" && typeof value.label === "string" && isObjectCategoryArray(value.categories);
}
function isCountryClass(value) {
  return isRecord2(value) && typeof value.class === "string" && isStringArray(value.countries);
}
function isCountryClassArray(value) {
  return Array.isArray(value) && value.every(isCountryClass);
}
function isPropertySpecArray(value) {
  return Array.isArray(value) && value.every(isPropertySpec);
}

// lib/schema/schema.ts
function fetchTransactionTypes(client) {
  return requestJson(client, "/transaction-type", isStringArray);
}
function fetchPartyTypes(client) {
  return requestJson(client, "/party-type", isStringArray);
}
function fetchTransportBy(client) {
  return requestJson(client, "/transport-by", isStringArray);
}
function fetchCountries(client) {
  return requestJson(client, "/country", isStringArray);
}
function fetchCategories(client) {
  return requestJson(client, "/category", isObjectCategoryArray);
}
function fetchCategory(client, value) {
  return requestJson(client, `/category/${encodeURIComponent(value)}`, isObjectCategory);
}
function fetchBroadCategories(client) {
  return requestJson(client, "/category/broad", isBroadCategoryRefArray);
}
function fetchBroadCategory(client, value) {
  return requestJson(client, `/category/broad/${encodeURIComponent(value)}`, isBroadCategoryDetail);
}
function fetchObjectProperties(client) {
  return requestJson(client, "/property/object", isPropertySpecArray);
}
function fetchObjectProperty(client, value) {
  return requestJson(client, `/property/object/${encodeURIComponent(value)}`, isPropertySpec);
}
function fetchPartyProperties(client) {
  return requestJson(client, "/property/party", isPropertySpecArray);
}
function fetchPartyProperty(client, value) {
  return requestJson(client, `/property/party/${encodeURIComponent(value)}`, isPropertySpec);
}
function fetchCountryClasses(client) {
  return requestJson(client, "/country-class", isCountryClassArray);
}
async function fetchSchema(client) {
  const all = await safePromise4(
    Promise.all([
      fetchTransactionTypes(client),
      fetchPartyTypes(client),
      fetchTransportBy(client),
      fetchCountries(client),
      fetchCategories(client),
      fetchObjectProperties(client),
      fetchPartyProperties(client)
    ])
  );
  if (isError6(all)) {
    return error9(toError(all.error));
  }
  const [
    transactionTypes,
    partyTypes,
    transportBy,
    countries,
    categories,
    objectProperties,
    partyProperties
  ] = all.value;
  if (isError6(transactionTypes)) {
    return transactionTypes;
  }
  if (isError6(partyTypes)) {
    return partyTypes;
  }
  if (isError6(transportBy)) {
    return transportBy;
  }
  if (isError6(countries)) {
    return countries;
  }
  if (isError6(categories)) {
    return categories;
  }
  if (isError6(objectProperties)) {
    return objectProperties;
  }
  if (isError6(partyProperties)) {
    return partyProperties;
  }
  return result9({
    transactionTypes: transactionTypes.value,
    partyTypes: partyTypes.value,
    transportBy: transportBy.value,
    countries: countries.value,
    categories: categories.value,
    objectProperties: objectProperties.value,
    partyProperties: partyProperties.value
  });
}

// lib/vat-validation/vat-validation-guards.ts
function isRecord3(value) {
  return typeof value === "object" && value !== null;
}
function isStringArray2(value) {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
function isVatValidationOutput(value) {
  return isRecord3(value) && typeof value.valid === "boolean" && (value.template_validated === void 0 || typeof value.template_validated === "boolean") && (value.invalid_context === void 0 || isStringArray2(value.invalid_context));
}
function isVatTemplate(value) {
  return isRecord3(value) && typeof value.country === "string" && typeof value.country_code === "string" && typeof value.template === "string";
}
function isVatTemplateArray(value) {
  return Array.isArray(value) && value.every(isVatTemplate);
}

// lib/vat-validation/vat-validation.ts
function validateVat(client, input) {
  return requestJson(client, "/vat-validation", isVatValidationOutput, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input)
  });
}
function fetchVatTemplates(client) {
  return requestJson(client, "/vat-template", isVatTemplateArray);
}
function fetchVatTemplate(client, country) {
  return requestJson(client, `/vat-template/${encodeURIComponent(country)}`, isVatTemplate);
}

// lib/inference/inference-guards.ts
function isRecord4(value) {
  return typeof value === "object" && value !== null;
}
function isStringArray3(value) {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
function isArgs(value) {
  return Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean");
}
function isAnalysisProperty(value) {
  return isRecord4(value) && typeof value.type === "string" && isArgs(value.args);
}
function isRawProperty(value) {
  return isRecord4(value) && typeof value.type === "string" && (value.args === void 0 || isArgs(value.args));
}
function isCandidate(value) {
  return isRecord4(value) && typeof value.type === "string" && isStringArray3(value.transaction_types) && Array.isArray(value.properties) && value.properties.every(isAnalysisProperty) && isStringArray3(value.missing_properties) && Array.isArray(value.extra) && value.extra.every(isRawProperty) && Array.isArray(value.invalid) && value.invalid.every(isRawProperty) && typeof value.comment === "string";
}
function isInferenceResult(value) {
  return isRecord4(value) && Array.isArray(value.candidates) && value.candidates.every(isCandidate);
}

// lib/inference/inference.ts
function inferObject(client, description) {
  return requestJson(client, "/inference/object", isInferenceResult, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ description })
  });
}

// lib/audit/audit.ts
import { result as result10, isError as isError7 } from "result-interface";

// lib/audit/audit-guards.ts
function isNumericRange(value) {
  return isRecord(value) && "min" in value && "max" in value;
}
function isAuditArg(value) {
  return isNumericRange(value) || value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isAuditProperty(value) {
  return isRecord(value) && typeof value.type === "string" && isUnknownArray(value.args) && value.args.every(isAuditArg);
}
function isAuditPropertyArray(value) {
  return isUnknownArray(value) && value.every(isAuditProperty);
}
function isAuditScenario(value) {
  return isRecord(value) && typeof value.supplier_type === "string" && typeof value.supplier_country === "string" && typeof value.receiver_type === "string" && typeof value.receiver_country === "string" && typeof value.transaction_type === "string" && isAuditPropertyArray(value.supplier_properties) && isAuditPropertyArray(value.customer_properties) && isAuditPropertyArray(value.object_properties) && isUnknownArray(value.grids) && value.grids.every(isTaxGridResult);
}
function isAuditTrailer(value) {
  return isRecord(value) && typeof value.done === "boolean" && typeof value.count === "number" && typeof value.truncated === "boolean" && typeof value.reason === "string";
}
function isAuditDimension(value) {
  return isRecord(value) && typeof value.field === "string" && typeof value.label === "string" && typeof value.mode === "string" && typeof value.control === "string" && (value.values_from === void 0 || typeof value.values_from === "string") && (value.values === void 0 || isStringArray(value.values)) && (value.classes_from === void 0 || typeof value.classes_from === "string") && (value.description === void 0 || typeof value.description === "string");
}
function isAuditCapabilities(value) {
  return isRecord(value) && typeof value.response_type === "string" && isRecord(value.conventions) && isUnknownArray(value.dimensions) && value.dimensions.every(isAuditDimension);
}

// lib/audit/audit.ts
function fetchAuditCapabilities(client) {
  return requestJson(client, "/audit/capabilities", isAuditCapabilities);
}
async function auditScenarios(client, request, options) {
  const lines = await streamLines(client, "/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
    body: JSON.stringify(request),
    signal: options?.signal
  });
  if (isError7(lines)) {
    return lines;
  }
  return result10(parseScenarios(lines.value));
}
async function* parseScenarios(lines) {
  for await (const line of lines) {
    const parsed = JSON.parse(line);
    if (isAuditTrailer(parsed)) {
      return parsed;
    }
    if (isAuditScenario(parsed)) {
      yield parsed;
      continue;
    }
    if (isRecord(parsed) && typeof parsed.error === "string") {
      throw new Error(parsed.error);
    }
    throw new Error("audit stream returned an unexpected line");
  }
  throw new Error("audit stream ended without a trailer");
}

// lib/auth/auth.ts
import { result as result11, isError as isError8 } from "result-interface";

// lib/auth/auth-guards.ts
function isRecord5(value) {
  return typeof value === "object" && value !== null;
}
function isAuthIdentity(value) {
  return isRecord5(value) && typeof value.name === "string" && typeof value.email === "string";
}

// lib/auth/auth.ts
function isOk(value) {
  return typeof value === "object" && value !== null && typeof value.ok === "boolean";
}
function login(client, input) {
  return requestJson(client, "/auth/login", isAuthIdentity, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input)
  });
}
function fetchIdentity(client) {
  return requestJson(client, "/auth/me", isAuthIdentity);
}
async function logout(client) {
  const res = await requestJson(client, "/auth/logout", isOk, { method: "POST" });
  return isError8(res) ? res : result11(res.value.ok);
}
export {
  ApiError,
  DEFAULT_BASE_URL,
  VatmiraalClient,
  analysisObject,
  analyzeTaxGrid,
  apiErrorFromResponse,
  auditScenarios,
  fetchAuditCapabilities,
  fetchBroadCategories,
  fetchBroadCategory,
  fetchCategories,
  fetchCategory,
  fetchCountries,
  fetchCountryClasses,
  fetchIdentity,
  fetchObjectProperties,
  fetchObjectProperty,
  fetchPartyProperties,
  fetchPartyProperty,
  fetchPartyTypes,
  fetchSchema,
  fetchTransactionTypes,
  fetchTransportBy,
  fetchVatTemplate,
  fetchVatTemplates,
  inferObject,
  isApiErrorBody,
  isAuditArg,
  isAuditCapabilities,
  isAuditDimension,
  isAuditProperty,
  isAuditScenario,
  isAuditTrailer,
  isAuthIdentity,
  isBroadCategoryDetail,
  isBroadCategoryRef,
  isBroadCategoryRefArray,
  isCountryClass,
  isCountryClassArray,
  isInferenceResult,
  isJustification,
  isJustificationContext,
  isLegalReference,
  isNumericRange,
  isObjectCategory,
  isObjectCategoryArray,
  isPropertyArg,
  isPropertySpec,
  isPropertySpecArray,
  isSafeAnalysisObject,
  isSafeParty,
  isSafeTaxGridAnalysisRequest,
  isSafeTransaction,
  isSafeTransport,
  isTaxGridAnalysisResponse,
  isTaxGridResult,
  isVatTemplate,
  isVatTemplateArray,
  isVatValidationOutput,
  isWarning,
  login,
  logout,
  party,
  ping,
  streamLines,
  taxGridAnalysisRequest,
  transaction,
  transport,
  validateVat
};
//# sourceMappingURL=index.js.map