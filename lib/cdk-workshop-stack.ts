import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// ec2 に関するパッケージを import
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // vpc を宣言
    const vpc = new ec2.Vpc(this, "BlogVpc", {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    
  }
}
