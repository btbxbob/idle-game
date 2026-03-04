import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import hudson.security.HudsonPrivateSecurityRealm
import jenkins.model.Jenkins

String adminUser = System.getenv('JENKINS_ADMIN_ID') ?: 'admin'
String adminPassword = System.getenv('JENKINS_ADMIN_PASSWORD') ?: 'admin123'

Jenkins jenkins = Jenkins.get()

if (!(jenkins.getSecurityRealm() instanceof HudsonPrivateSecurityRealm)) {
    HudsonPrivateSecurityRealm securityRealm = new HudsonPrivateSecurityRealm(false)
    securityRealm.createAccount(adminUser, adminPassword)
    jenkins.setSecurityRealm(securityRealm)

    FullControlOnceLoggedInAuthorizationStrategy authorizationStrategy = new FullControlOnceLoggedInAuthorizationStrategy()
    authorizationStrategy.setAllowAnonymousRead(false)
    jenkins.setAuthorizationStrategy(authorizationStrategy)

    jenkins.save()
    println("Created Jenkins admin user: ${adminUser}")
}
