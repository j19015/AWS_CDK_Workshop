import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ec2 に関するパッケージを import
import * as ec2 from "aws-cdk-lib/aws-ec2";

// ファイルを読み込むためのパッケージを import
import { readFileSync } from "fs";

// rds のパッケージを import
import * as rds from "aws-cdk-lib/aws-rds";

// ALB を宣言するためのパッケージをimport
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

// target を追加するためのパッケージimport
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";

// 自作コンストラクトを import
import { WebServerInstance } from './constructs/web-server-instance';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // vpc を宣言
    const vpc = new ec2.Vpc(this, "BlogVpc", {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    
   // 新しく作成したコンストラクトを使用してインスタンスを宣言
    const webServer1 = new WebServerInstance(this, 'WebServer1', {
      vpc
    });
    
     // 2 台目のインスタンスを宣言
    const webServer2 = new WebServerInstance(this, 'WebServer2', {
      vpc,
    });
    
    // RDS のインスタンスを宣言
    const dbServer = new rds.DatabaseInstance(this, "WordPressDB", {
      vpc,
      // DatabaseInstanceEngine クラスを利用してデータベースエンジンを設定
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_31 }),
      // RDS DB インスタンスのインスタンスタイプを設定
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      // RDS DB インスタンスのデータベース名を設定
      databaseName: "wordpress",
    });
    
    // WebServer からのアクセスを許可
    dbServer.connections.allowDefaultPortFrom(webServer1.instance);
    // 2 台目のインスタンスの DB インスタンスへのアクセスを許可
    dbServer.connections.allowDefaultPortFrom(webServer2.instance);

    
    // Application Load Balancer を宣言
    const alb = new elbv2.ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc,
      internetFacing: true,
    });
    // リスナーを追加
    const listener = alb.addListener("Listener", {
      port: 80,
    });
    // インスタンスをターゲットに追加
    listener.addTargets("ApplicationFleet", {
      port: 80,
      targets: [new targets.InstanceTarget(webServer1.instance, 80),
        // ターゲットに 2 台目のインスタンスを追加
        new targets.InstanceTarget(webServer2.instance, 80)],
      healthCheck: {
        path: "/wp-includes/images/blank.gif",
      },
    });

    // ALB からインスタンスへのアクセスを許可
    webServer1.instance.connections.allowFrom(alb, ec2.Port.tcp(80));
    // ALB から 2 台目のインスタンスへのアクセスを許可
    webServer2.instance.connections.allowFrom(alb, ec2.Port.tcp(80));

  }
}
