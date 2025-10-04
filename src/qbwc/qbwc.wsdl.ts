import { AppConfig } from '../config/app.config';

export const wsdlXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="QBWebConnectorSvc"
  targetNamespace="http://developer.intuit.com/"
  xmlns:tns="http://developer.intuit.com/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="http://schemas.xmlsoap.org/wsdl/">

  <types>
    <xsd:schema targetNamespace="http://developer.intuit.com/"
                elementFormDefault="qualified">

      <xsd:complexType name="ArrayOfString">
        <xsd:sequence>
          <xsd:element name="string" type="xsd:string" minOccurs="0" maxOccurs="unbounded"/>
        </xsd:sequence>
      </xsd:complexType>

      <xsd:element name="serverVersion"><xsd:complexType/></xsd:element>
      <xsd:element name="serverVersionResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="serverVersionResult" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="clientVersion">
        <xsd:complexType><xsd:sequence><xsd:element name="strVersion" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="clientVersionResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="clientVersionResult" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="authenticate">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="strUserName" type="xsd:string"/>
          <xsd:element name="strPassword" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="authenticateResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="authenticateResult" type="tns:ArrayOfString"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="sendRequestXML">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="ticket" type="xsd:string"/>
          <xsd:element name="strHCPResponse" type="xsd:string"/>
          <xsd:element name="strCompanyFileName" type="xsd:string"/>
          <xsd:element name="qbXMLCountry" type="xsd:string"/>
          <xsd:element name="qbXMLMajorVers" type="xsd:int"/>
          <xsd:element name="qbXMLMinorVers" type="xsd:int"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="sendRequestXMLResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="sendRequestXMLResult" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="receiveResponseXML">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="ticket" type="xsd:string"/>
          <xsd:element name="response" type="xsd:string"/>
          <xsd:element name="hresult" type="xsd:string"/>
          <xsd:element name="message" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="receiveResponseXMLResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="receiveResponseXMLResult" type="xsd:int"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="connectionError">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="ticket" type="xsd:string"/>
          <xsd:element name="hresult" type="xsd:string"/>
          <xsd:element name="message" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="connectionErrorResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="connectionErrorResult" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="getLastError">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="ticket" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="getLastErrorResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="getLastErrorResult" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>

      <xsd:element name="closeConnection">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="ticket" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="closeConnectionResponse">
        <xsd:complexType><xsd:sequence><xsd:element name="closeConnectionResult" type="xsd:string"/></xsd:sequence></xsd:complexType>
      </xsd:element>

    </xsd:schema>
  </types>

  <message name="serverVersionRequest"><part element="tns:serverVersion" name="parameters"/></message>
  <message name="serverVersionResponse"><part element="tns:serverVersionResponse" name="parameters"/></message>

  <message name="clientVersionRequest"><part element="tns:clientVersion" name="parameters"/></message>
  <message name="clientVersionResponse"><part element="tns:clientVersionResponse" name="parameters"/></message>

  <message name="authenticateRequest"><part element="tns:authenticate" name="parameters"/></message>
  <message name="authenticateResponse"><part element="tns:authenticateResponse" name="parameters"/></message>

  <message name="sendRequestXMLRequest"><part element="tns:sendRequestXML" name="parameters"/></message>
  <message name="sendRequestXMLResponse"><part element="tns:sendRequestXMLResponse" name="parameters"/></message>

  <message name="receiveResponseXMLRequest"><part element="tns:receiveResponseXML" name="parameters"/></message>
  <message name="receiveResponseXMLResponse"><part element="tns:receiveResponseXMLResponse" name="parameters"/></message>

  <message name="connectionErrorRequest"><part element="tns:connectionError" name="parameters"/></message>
  <message name="connectionErrorResponse"><part element="tns:connectionErrorResponse" name="parameters"/></message>

  <message name="getLastErrorRequest"><part element="tns:getLastError" name="parameters"/></message>
  <message name="getLastErrorResponse"><part element="tns:getLastErrorResponse" name="parameters"/></message>

  <message name="closeConnectionRequest"><part element="tns:closeConnection" name="parameters"/></message>
  <message name="closeConnectionResponse"><part element="tns:closeConnectionResponse" name="parameters"/></message>

  <portType name="QBWebConnectorSvcSoap">
    <operation name="serverVersion"><input message="tns:serverVersionRequest"/><output message="tns:serverVersionResponse"/></operation>
    <operation name="clientVersion"><input message="tns:clientVersionRequest"/><output message="tns:clientVersionResponse"/></operation>
    <operation name="authenticate"><input message="tns:authenticateRequest"/><output message="tns:authenticateResponse"/></operation>
    <operation name="sendRequestXML"><input message="tns:sendRequestXMLRequest"/><output message="tns:sendRequestXMLResponse"/></operation>
    <operation name="receiveResponseXML"><input message="tns:receiveResponseXMLRequest"/><output message="tns:receiveResponseXMLResponse"/></operation>
    <operation name="connectionError"><input message="tns:connectionErrorRequest"/><output message="tns:connectionErrorResponse"/></operation>
    <operation name="getLastError"><input message="tns:getLastErrorRequest"/><output message="tns:getLastErrorResponse"/></operation>
    <operation name="closeConnection"><input message="tns:closeConnectionRequest"/><output message="tns:closeConnectionResponse"/></operation>
  </portType>

  <binding name="QBWebConnectorSvcSoap" type="tns:QBWebConnectorSvcSoap">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="serverVersion"><soap:operation soapAction="http://developer.intuit.com/serverVersion"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="clientVersion"><soap:operation soapAction="http://developer.intuit.com/clientVersion"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="authenticate"><soap:operation soapAction="http://developer.intuit.com/authenticate"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="sendRequestXML"><soap:operation soapAction="http://developer.intuit.com/sendRequestXML"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="receiveResponseXML"><soap:operation soapAction="http://developer.intuit.com/receiveResponseXML"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="connectionError"><soap:operation soapAction="http://developer.intuit.com/connectionError"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="getLastError"><soap:operation soapAction="http://developer.intuit.com/getLastError"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
    <operation name="closeConnection"><soap:operation soapAction="http://developer.intuit.com/closeConnection"/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation>
  </binding>

  <service name="QBWebConnectorSvc">
    <port name="QBWebConnectorSvcSoap" binding="tns:QBWebConnectorSvcSoap">
      <soap:address location="http://localhost:3005/qbwc"/>
    </port>
  </service>
</definitions>`;

export function getWSDL(): string {
  return wsdlXml.replace('http://localhost:3005', AppConfig.baseUrl);
}
