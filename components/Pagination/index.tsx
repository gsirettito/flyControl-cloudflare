import { PaginationType } from "@/types/PaginationType";
import { Pagination } from "@ark-ui/react/pagination";
import { Button, Flex } from "@mantine/core";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Props = {
  onPageSelect?: (page: number) => void;
} & PaginationType;

export const PaginationMain = (props: Props) => {
  const handlePageChange = (details: { page: number }) => {
    // details.page es 1‑based
    props.onPageSelect?.(details.page);
  };

  return (
    <Pagination.Root
      count={props.total}
      pageSize={props.limit}
      page={props.page}        // Espera 1‑based
      onPageChange={handlePageChange}
      siblingCount={2}
      style={{ display: "flex", gap: "5px" }}
    >
      <Pagination.PrevTrigger style={{ background: "transparent", border: "none" }}>
        <Button component="span" variant="transparent" size="xs">
          <FiChevronLeft />
        </Button>
      </Pagination.PrevTrigger>

      <Flex w="100%" style={{ justifyContent: "center", alignItems: "center" }} gap={1}>
        <Pagination.Context>
          {(pagination) =>
            pagination.pages.map((page, index) =>
              page.type === "page" ? (
                <Pagination.Item
                  key={index}
                  {...page}
                  style={{ background: "transparent", border: "none" }}
                >
                  <Button
                    component="span"
                    size="xs"
                    variant={page.value === props.page ? "filled" : "transparent"}
                  >
                    {page.value}
                  </Button>
                </Pagination.Item>
              ) : (
                <Pagination.Ellipsis key={index} index={index}>
                  &#8230;
                </Pagination.Ellipsis>
              )
            )
          }
        </Pagination.Context>
      </Flex>

      <Pagination.NextTrigger style={{ background: "transparent", border: "none" }}>
        <Button component="span" variant="transparent" size="xs">
          <FiChevronRight />
        </Button>
      </Pagination.NextTrigger>
    </Pagination.Root>
  );
};