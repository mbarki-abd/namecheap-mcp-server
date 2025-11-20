import axios, { AxiosInstance } from 'axios';
import { parseStringPromise } from 'xml2js';

export interface NamecheapConfig {
  apiUser: string;
  apiKey: string;
  userName: string;
  clientIp: string;
  sandbox?: boolean;
}

export class NamecheapClient {
  private client: AxiosInstance;
  private config: NamecheapConfig;
  private baseUrl: string;

  constructor(config: NamecheapConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? 'https://api.sandbox.namecheap.com/xml.response'
      : 'https://api.namecheap.com/xml.response';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  private async makeRequest(command: string, params: Record<string, any> = {}) {
    const requestParams = {
      ApiUser: this.config.apiUser,
      ApiKey: this.config.apiKey,
      UserName: this.config.userName,
      ClientIp: this.config.clientIp,
      Command: command,
      ...params,
    };

    try {
      const response = await this.client.get('', { params: requestParams });
      const result = await parseStringPromise(response.data);

      // Check for API errors
      if (result.ApiResponse?.$.Status === 'ERROR') {
        const errors = result.ApiResponse.Errors?.[0]?.Error || [];
        const errorMessages = errors.map((e: any) => e._).join(', ');
        throw new Error(`Namecheap API Error: ${errorMessages}`);
      }

      return result.ApiResponse;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API request failed: ${error.response.status} - ${error.response.statusText}`);
      }
      throw error;
    }
  }

  // ==================== DOMAINS ====================

  async checkDomain(domains: string[]) {
    return this.makeRequest('namecheap.domains.check', {
      DomainList: domains.join(','),
    });
  }

  async getDomainInfo(domainName: string) {
    return this.makeRequest('namecheap.domains.getInfo', {
      DomainName: domainName,
    });
  }

  async listDomains(params: {
    listType?: string;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  } = {}) {
    return this.makeRequest('namecheap.domains.getList', {
      ListType: params.listType || 'ALL',
      SearchTerm: params.searchTerm,
      Page: params.page || 1,
      PageSize: params.pageSize || 20,
      SortBy: params.sortBy,
    });
  }

  async registerDomain(params: {
    domainName: string;
    years: number;
    registrantFirstName: string;
    registrantLastName: string;
    registrantAddress1: string;
    registrantCity: string;
    registrantStateProvince: string;
    registrantPostalCode: string;
    registrantCountry: string;
    registrantPhone: string;
    registrantEmailAddress: string;
    techFirstName?: string;
    techLastName?: string;
    techAddress1?: string;
    techCity?: string;
    techStateProvince?: string;
    techPostalCode?: string;
    techCountry?: string;
    techPhone?: string;
    techEmailAddress?: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminAddress1?: string;
    adminCity?: string;
    adminStateProvince?: string;
    adminPostalCode?: string;
    adminCountry?: string;
    adminPhone?: string;
    adminEmailAddress?: string;
    auxBillingFirstName?: string;
    auxBillingLastName?: string;
    auxBillingAddress1?: string;
    auxBillingCity?: string;
    auxBillingStateProvince?: string;
    auxBillingPostalCode?: string;
    auxBillingCountry?: string;
    auxBillingPhone?: string;
    auxBillingEmailAddress?: string;
    nameservers?: string[];
    addFreeWhoisguard?: boolean;
    wgEnabled?: boolean;
  }) {
    const requestParams: any = {
      DomainName: params.domainName,
      Years: params.years,
      RegistrantFirstName: params.registrantFirstName,
      RegistrantLastName: params.registrantLastName,
      RegistrantAddress1: params.registrantAddress1,
      RegistrantCity: params.registrantCity,
      RegistrantStateProvince: params.registrantStateProvince,
      RegistrantPostalCode: params.registrantPostalCode,
      RegistrantCountry: params.registrantCountry,
      RegistrantPhone: params.registrantPhone,
      RegistrantEmailAddress: params.registrantEmailAddress,
    };

    // Tech contact (defaults to registrant if not provided)
    requestParams.TechFirstName = params.techFirstName || params.registrantFirstName;
    requestParams.TechLastName = params.techLastName || params.registrantLastName;
    requestParams.TechAddress1 = params.techAddress1 || params.registrantAddress1;
    requestParams.TechCity = params.techCity || params.registrantCity;
    requestParams.TechStateProvince = params.techStateProvince || params.registrantStateProvince;
    requestParams.TechPostalCode = params.techPostalCode || params.registrantPostalCode;
    requestParams.TechCountry = params.techCountry || params.registrantCountry;
    requestParams.TechPhone = params.techPhone || params.registrantPhone;
    requestParams.TechEmailAddress = params.techEmailAddress || params.registrantEmailAddress;

    // Admin contact (defaults to registrant if not provided)
    requestParams.AdminFirstName = params.adminFirstName || params.registrantFirstName;
    requestParams.AdminLastName = params.adminLastName || params.registrantLastName;
    requestParams.AdminAddress1 = params.adminAddress1 || params.registrantAddress1;
    requestParams.AdminCity = params.adminCity || params.registrantCity;
    requestParams.AdminStateProvince = params.adminStateProvince || params.registrantStateProvince;
    requestParams.AdminPostalCode = params.adminPostalCode || params.registrantPostalCode;
    requestParams.AdminCountry = params.adminCountry || params.registrantCountry;
    requestParams.AdminPhone = params.adminPhone || params.registrantPhone;
    requestParams.AdminEmailAddress = params.adminEmailAddress || params.registrantEmailAddress;

    // AuxBilling contact (defaults to registrant if not provided)
    requestParams.AuxBillingFirstName = params.auxBillingFirstName || params.registrantFirstName;
    requestParams.AuxBillingLastName = params.auxBillingLastName || params.registrantLastName;
    requestParams.AuxBillingAddress1 = params.auxBillingAddress1 || params.registrantAddress1;
    requestParams.AuxBillingCity = params.auxBillingCity || params.registrantCity;
    requestParams.AuxBillingStateProvince = params.auxBillingStateProvince || params.registrantStateProvince;
    requestParams.AuxBillingPostalCode = params.auxBillingPostalCode || params.registrantPostalCode;
    requestParams.AuxBillingCountry = params.auxBillingCountry || params.registrantCountry;
    requestParams.AuxBillingPhone = params.auxBillingPhone || params.registrantPhone;
    requestParams.AuxBillingEmailAddress = params.auxBillingEmailAddress || params.registrantEmailAddress;

    if (params.nameservers && params.nameservers.length > 0) {
      params.nameservers.forEach((ns, index) => {
        requestParams[`Nameservers.${index + 1}`] = ns;
      });
    }

    if (params.addFreeWhoisguard !== undefined) {
      requestParams.AddFreeWhoisguard = params.addFreeWhoisguard ? 'yes' : 'no';
    }
    if (params.wgEnabled !== undefined) {
      requestParams.WGEnabled = params.wgEnabled ? 'yes' : 'no';
    }

    return this.makeRequest('namecheap.domains.create', requestParams);
  }

  async renewDomain(domainName: string, years: number) {
    return this.makeRequest('namecheap.domains.renew', {
      DomainName: domainName,
      Years: years,
    });
  }

  async reactivateDomain(domainName: string) {
    return this.makeRequest('namecheap.domains.reactivate', {
      DomainName: domainName,
    });
  }

  async getContacts(domainName: string) {
    return this.makeRequest('namecheap.domains.getContacts', {
      DomainName: domainName,
    });
  }

  async setContacts(domainName: string, contacts: any) {
    return this.makeRequest('namecheap.domains.setContacts', {
      DomainName: domainName,
      ...contacts,
    });
  }

  // ==================== DNS ====================

  async getHosts(sld: string, tld: string) {
    return this.makeRequest('namecheap.domains.dns.getHosts', {
      SLD: sld,
      TLD: tld,
    });
  }

  async setHosts(sld: string, tld: string, hosts: Array<{
    hostName: string;
    recordType: string;
    address: string;
    mxPref?: number;
    ttl?: number;
  }>) {
    const params: any = {
      SLD: sld,
      TLD: tld,
    };

    hosts.forEach((host, index) => {
      const i = index + 1;
      params[`HostName${i}`] = host.hostName;
      params[`RecordType${i}`] = host.recordType;
      params[`Address${i}`] = host.address;
      if (host.mxPref !== undefined) {
        params[`MXPref${i}`] = host.mxPref;
      }
      if (host.ttl !== undefined) {
        params[`TTL${i}`] = host.ttl;
      }
    });

    return this.makeRequest('namecheap.domains.dns.setHosts', params);
  }

  async getEmailForwarding(domainName: string) {
    return this.makeRequest('namecheap.domains.dns.getEmailForwarding', {
      DomainName: domainName,
    });
  }

  async setEmailForwarding(domainName: string, mailboxes: Array<{
    mailbox: string;
    forwardTo: string;
  }>) {
    const params: any = {
      DomainName: domainName,
    };

    mailboxes.forEach((mb, index) => {
      const i = index + 1;
      params[`MailBox${i}`] = mb.mailbox;
      params[`ForwardTo${i}`] = mb.forwardTo;
    });

    return this.makeRequest('namecheap.domains.dns.setEmailForwarding', params);
  }

  async setCustomDNS(sld: string, tld: string, nameservers: string[]) {
    const params: any = {
      SLD: sld,
      TLD: tld,
    };

    nameservers.forEach((ns, index) => {
      params[`Nameservers${index + 1}`] = ns;
    });

    return this.makeRequest('namecheap.domains.dns.setCustom', params);
  }

  async setDefaultDNS(sld: string, tld: string) {
    return this.makeRequest('namecheap.domains.dns.setDefault', {
      SLD: sld,
      TLD: tld,
    });
  }

  async getDNSList(sld: string, tld: string) {
    return this.makeRequest('namecheap.domains.dns.getList', {
      SLD: sld,
      TLD: tld,
    });
  }

  // ==================== SSL ====================

  async getSSLList(params: {
    listType?: string;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  } = {}) {
    return this.makeRequest('namecheap.ssl.getList', {
      ListType: params.listType || 'ALL',
      SearchTerm: params.searchTerm,
      Page: params.page || 1,
      PageSize: params.pageSize || 20,
      SortBy: params.sortBy,
    });
  }

  async getSSLInfo(certificateId: number) {
    return this.makeRequest('namecheap.ssl.getInfo', {
      CertificateID: certificateId,
    });
  }

  async activateSSL(params: {
    certificateId: number;
    csr: string;
    adminEmailAddress: string;
    webServerType: string;
    approverEmail?: string;
  }) {
    return this.makeRequest('namecheap.ssl.activate', {
      CertificateID: params.certificateId,
      CSR: params.csr,
      AdminEmailAddress: params.adminEmailAddress,
      WebServerType: params.webServerType,
      ApproverEmail: params.approverEmail,
    });
  }

  async reissueSSL(params: {
    certificateId: number;
    csr: string;
    webServerType: string;
    approverEmail?: string;
  }) {
    return this.makeRequest('namecheap.ssl.reissue', {
      CertificateID: params.certificateId,
      CSR: params.csr,
      WebServerType: params.webServerType,
      ApproverEmail: params.approverEmail,
    });
  }

  async renewSSL(certificateId: number, years: number, sslType: string) {
    return this.makeRequest('namecheap.ssl.renew', {
      CertificateID: certificateId,
      Years: years,
      SSLType: sslType,
    });
  }

  // ==================== WHOISGUARD ====================

  async enableWhoisguard(whoisguardId: number, forwardedToEmail: string) {
    return this.makeRequest('namecheap.whoisguard.enable', {
      WhoisguardID: whoisguardId,
      ForwardedToEmail: forwardedToEmail,
    });
  }

  async disableWhoisguard(whoisguardId: number) {
    return this.makeRequest('namecheap.whoisguard.disable', {
      WhoisguardID: whoisguardId,
    });
  }

  async getWhoisguardList(params: {
    listType?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    return this.makeRequest('namecheap.whoisguard.getList', {
      ListType: params.listType || 'ALL',
      Page: params.page || 1,
      PageSize: params.pageSize || 20,
    });
  }

  // ==================== NAMESERVERS ====================

  async createNameserver(sld: string, tld: string, nameserver: string, ip: string) {
    return this.makeRequest('namecheap.domains.ns.create', {
      SLD: sld,
      TLD: tld,
      Nameserver: nameserver,
      IP: ip,
    });
  }

  async deleteNameserver(sld: string, tld: string, nameserver: string) {
    return this.makeRequest('namecheap.domains.ns.delete', {
      SLD: sld,
      TLD: tld,
      Nameserver: nameserver,
    });
  }

  async getNameserverInfo(sld: string, tld: string, nameserver: string) {
    return this.makeRequest('namecheap.domains.ns.getInfo', {
      SLD: sld,
      TLD: tld,
      Nameserver: nameserver,
    });
  }

  async updateNameserver(sld: string, tld: string, nameserver: string, oldIP: string, newIP: string) {
    return this.makeRequest('namecheap.domains.ns.update', {
      SLD: sld,
      TLD: tld,
      Nameserver: nameserver,
      OldIP: oldIP,
      IP: newIP,
    });
  }

  // ==================== DOMAIN TRANSFER ====================

  async transferDomain(params: {
    domainName: string;
    eppCode: string;
    years?: number;
    registrantFirstName: string;
    registrantLastName: string;
    registrantAddress1: string;
    registrantCity: string;
    registrantStateProvince: string;
    registrantPostalCode: string;
    registrantCountry: string;
    registrantPhone: string;
    registrantEmailAddress: string;
  }) {
    return this.makeRequest('namecheap.domains.transfer.create', {
      DomainName: params.domainName,
      EPPCode: params.eppCode,
      Years: params.years || 1,
      RegistrantFirstName: params.registrantFirstName,
      RegistrantLastName: params.registrantLastName,
      RegistrantAddress1: params.registrantAddress1,
      RegistrantCity: params.registrantCity,
      RegistrantStateProvince: params.registrantStateProvince,
      RegistrantPostalCode: params.registrantPostalCode,
      RegistrantCountry: params.registrantCountry,
      RegistrantPhone: params.registrantPhone,
      RegistrantEmailAddress: params.registrantEmailAddress,
    });
  }

  async getTransferStatus(domainName: string) {
    return this.makeRequest('namecheap.domains.transfer.getStatus', {
      DomainName: domainName,
    });
  }

  async getTransferList(params: {
    listType?: string;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    return this.makeRequest('namecheap.domains.transfer.getList', {
      ListType: params.listType || 'ALL',
      SearchTerm: params.searchTerm,
      Page: params.page || 1,
      PageSize: params.pageSize || 20,
    });
  }

  // ==================== USERS ====================

  async getPricing(productType: string, productCategory?: string) {
    return this.makeRequest('namecheap.users.getPricing', {
      ProductType: productType,
      ProductCategory: productCategory,
    });
  }

  async getBalances() {
    return this.makeRequest('namecheap.users.getBalances');
  }

  async getAddressInfo(addressId?: number) {
    const params: any = {};
    if (addressId) {
      params.AddressId = addressId;
    }
    return this.makeRequest('namecheap.users.address.getInfo', params);
  }
}
