import { openMiniApp } from "zmp-sdk";
import { Box, Button, Icon, Page, Text, useNavigate } from "zmp-ui";

import Clock from "@/components/clock";
import Logo from "@/components/logo";
import bg from "@/static/bg.svg";

function HomePage() {
  const navigate = useNavigate()
  return (
    <Page
      className="flex flex-col items-center justify-center space-y-6 bg-cover bg-center bg-no-repeat bg-white dark:bg-black"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <Box></Box>
      <Box textAlign="center" className="space-y-1">
        <Clock />
      </Box>
      <Button
        variant="primary"
        suffixIcon={<Icon icon="zi-more-grid" />}
        onClick={() => {
          // openMiniApp({
          //   appId: "1070750904448149704", // ZaUI Components
          // });
          navigate('/read-card')
          
        }}
      >
        Read card
      </Button>
      <Logo className="fixed bottom-8" />
    </Page>
  );
}

export default HomePage;
