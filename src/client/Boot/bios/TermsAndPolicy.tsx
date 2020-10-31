import React from "react";
import { BiosButtonActive, TermsAndPolicyContainer } from "./BiosStyled";

export interface BiosTermsAndPolicyState {
  onAcceptTermsOfPolicy(): void;
}

export class BiosTermsAndPolicy extends React.Component<BiosTermsAndPolicyState> {
  private readonly date = "12/10/2020";
  private readonly address = location.origin;
  private readonly country = "";

  render() {
    return (
      <TermsAndPolicyContainer>
        <h2>
          Terms of Use of <span className='website_url'>{this.address}</span>
        </h2>

        <p>
          Welcome to the <span className='website_name'>Lindows</span> website (the &#34;Website&#34;).
        </p>

        <p>
          <span className='website_name'>Lindows</span> provides this Website and Services (located at
          <span className='website_url'>{this.address}</span>) to you subject to the notices, terms, and conditions set
          forth in these terms (the &#34;Terms of Use&#34;). In addition, when you use any of our Services, you will be
          subject to the rules, guidelines, policies, terms, and conditions applicable to such service, and they are
          incorporated into this Terms of Use by this reference.
        </p>

        <p>
          These Terms of Use are effective as of <span className='date'>{this.date}</span>.
        </p>

        <p>Your eligibility for use of the Website is contingent upon meeting the following conditions:</p>

        <ul>
          <li>You are at least 18 years of age</li>
          <li>
            You use the Website and Services according to these Terms of Use and all applicable laws and regulations
            determined by the state and country of residence
          </li>
          <li>
            You provide complete and accurate registration information and maintain accurate registration information on
            the Webite
          </li>
          <li>
            You agree and understand that <span className='website_name'>Lindows</span> may, at any time, and without
            prior notice, revoke and/or cancel your access if you fail to meet these criteria or violate any portion of
            these Terms of Use
          </li>
        </ul>

        <h3>Use of this Website</h3>

        <p>
          In connection with your use of our Website, you must act responsibly and exercise good judgment. Without
          limiting the foregoing, you will not:
        </p>

        <ul>
          <li>Violate any local, state, provincial, national, or other law or regulation, or any order of a court</li>
          <li>
            Infringe the rights of any person or entity, including without limitation, their intellectual property,
            privacy, publicity or contractual rights
          </li>
          <li>
            Interfere with or damage our Services, including, without limitation, through the use of viruses, cancel
            bots, Trojan horses, harmful code, flood pings, denial-of-service attacks, packet or IP spoofing, forged
            routing or electronic mail address information or similar methods or technology
          </li>
          <li>Use automated scripts to collect information or otherwise interact with the Services or the Website</li>
          <li>
            Enter into this agreement on behalf of another person or entity without consent or the legal capacity to
            make such agreements as a representative of an organization or entity
          </li>
        </ul>

        <h3>Intellectual Property</h3>

        <p>
          All code, text, software, scripts, graphics, files, photos, images, logos, and materials contained on this
          Website, or within the Services, are the sole property of <span className='website_name'>Lindows</span>.
        </p>

        <p>
          Unauthorized use of any materials contained on this Website or within the Service may violate copyright laws,
          trademark laws, the laws of privacy and publicity, and/or other regulations and statutes. If you believe that
          any of the materials infringe on any third party&#39;s rights, please contact{" "}
          <span className='website_name'>Lindows</span> immediately at the address provided below.
        </p>

        <h3>Third Party Websites</h3>

        <p>
          Our Website may link you to other sites on the Internet or otherwise include references to information,
          documents, software, materials and/or services provided by other parties. These websites may contain
          information or material that some people may find inappropriate or offensive.
        </p>

        <p>
          These other websites and parties are not under our control, and you acknowledge that we are not responsible
          for the accuracy, copyright compliance, legality, decency, or any other aspect of the content of such sites,
          nor are we responsible for errors or omissions in any references to other parties or their products and
          services. The inclusion of such a link or reference is provided merely as a convenience and does not imply
          endorsement of, or association with, the Website or party by us, or any warranty of any kind, either express
          or implied.
        </p>

        <h3>Disclaimer of Warranty and Limitation of Liability</h3>

        <p>
          The Website is provided &#34;AS IS.&#34; appfigures, its suppliers, officers, directors, employees, and agents
          exclude and disclaim all representations and warranties, express or implied, related to this Website or in
          connection with the Services. You exclude <span className='website_name'>Lindows</span> from all liability for
          damages related to or arising out of the use of this Website.
        </p>

        <h3>Changes to these Terms of Use</h3>

        <p>
          <span className='website_name'>Lindows</span> retains the right to, at any time, modify or discontinue, any or
          all parts of the Website without notice.
        </p>

        <p>
          Additionally, <span className='website_name'>Lindows</span> reserves the right, in its sole discretion, to
          modify these Terms of Use at any time, effective by posting new terms on the Website with the date of
          modification. You are responsible for reading and understanding the terms of this agreement prior to
          registering with, or using the Service. Your use of the Website and/or Services after any such modification
          has been published constitutes your acceptance of the new terms as modified in these Terms of Use.
        </p>

        <h3>Governing Law</h3>

        <p>
          These Terms of Use and any dispute or claim arising out of, or related to them, shall be governed by and
          construed in accordance with the internal laws of the <span className='country'>{this.country}</span> without
          giving effect to any choice or conflict of law provision or rule.
        </p>

        <p>
          Any legal suit, action or proceeding arising out of, or related to, these Terms of Use or the Website shall be
          instituted exclusively in the federal courts of <span className='country'>{this.country}</span>.
        </p>

        <BiosButtonActive onClick={() => this.props.onAcceptTermsOfPolicy()}>
          [ Accept terms of policy ]
        </BiosButtonActive>
        {/* <br><br><br><button className="btn btn-terminal" onclick="acceptTermsOfPolicy()">Accept terms of policy</button>
        <div style="height: 50px"></div> */}
        {/* <!-- <button className="btn btn-terminal" onclick="bootOption()">Continue with limited experience</button> --> */}
      </TermsAndPolicyContainer>
    );
  }
}
