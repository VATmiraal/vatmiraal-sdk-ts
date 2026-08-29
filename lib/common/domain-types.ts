/**
 * The VATmiraal enums shared across the client's modules.
 *
 * The API dictates which values each of these vocabularies allows, and that set can change,
 * so they cannot be pinned to string-literal unions at compile time. They are modelled as
 * `string`, and a value can only be confirmed valid at runtime against the vocabulary the API
 * reports (loaded through the schema module). The plain interfaces are typed with these enums
 * but do not themselves enforce the contract; to enforce it, use the validating classes and
 * type guards this library provides to check a value, or a whole interface, against the
 * current vocabulary.
 *
 * @module
 */

/**
 * A country the VAT rules recognise.
 *
 * @example 'belgium'
 */
export type Country = string;

/**
 * The role or status of a party to the transaction.
 *
 * @example 'company' // also 'individual', 'non_taxable_legal_entity'
 */
export type PartyType = string;

/**
 * The kind of transaction being analysed.
 *
 * @example 'service' // also 'delivery', 'transfer_of_goods', 'ic_acquisition', 'out_of_scope'
 */
export type TransactionType = string;

/**
 * The category of the good or service being transacted.
 *
 * @example 'general_service'
 */
export type ObjectType = string;

/**
 * Who is responsible for transporting the object.
 *
 * @example 'transport_by_seller' // also 'transport_on_account_of_seller', 'transport_by_buyer', 'transport_on_account_of_buyer'
 */
export type TransportBy = string;
